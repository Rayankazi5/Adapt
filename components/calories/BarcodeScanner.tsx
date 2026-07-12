import { useState, useRef, useCallback, useEffect } from 'react';
import { Scan, Loader2, Search } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { FoodEntry } from '../../pages/CalorieTracking';

interface BarcodeScannerProps {
    onFoodRecognized: (food: Omit<FoodEntry, 'id'>) => void;
}

export function BarcodeScanner({ onFoodRecognized }: BarcodeScannerProps) {
    const [barcode, setBarcode] = useState('');
    const [isScanning, setIsScanning] = useState(false);
    
    // For native Barcode Detector (if supported by the browser)
    const [cameraActive, setCameraActive] = useState(false);
    const videoRef = useRef<HTMLVideoElement>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const requestRef = useRef<number>();

    // Stop camera on unmount
    useEffect(() => {
        return () => stopCamera();
    }, []);

    const stopCamera = useCallback(() => {
        setCameraActive(false);
        if (requestRef.current) cancelAnimationFrame(requestRef.current);
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(t => t.stop());
            streamRef.current = null;
        }
    }, []);

    const startCamera = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: 'environment' }
            });
            streamRef.current = stream;
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
                // Need to await play before starting detection
                await videoRef.current.play();
                setCameraActive(true);
                scanVideoFrame();
            }
        } catch (err) {
            console.error('Camera error:', err);
            toast.error('Could not access camera. Please enter barcode manually.');
        }
    };

    const scanVideoFrame = useCallback(async () => {
        if (!videoRef.current || !cameraActive) return;

        // Try using the native BarcodeDetector API (supported in Chrome/Edge, Android, iOS Safari 17+)
        if ('BarcodeDetector' in window) {
            try {
                // @ts-ignore - BarcodeDetector is not standard TS yet
                const detector = new window.BarcodeDetector({ formats: ['ean_13', 'ean_8', 'upc_a', 'upc_e'] });
                const barcodes = await detector.detect(videoRef.current);
                
                if (barcodes.length > 0) {
                    const code = barcodes[0].rawValue;
                    setBarcode(code);
                    stopCamera();
                    toast.success(`Scanned: ${code}`);
                    handleBarcodeSubmit(code);
                    return;
                }
            } catch (err) {
                console.error("Barcode detection failed:", err);
            }
        }
        
        // Loop
        if (cameraActive) {
            requestRef.current = requestAnimationFrame(scanVideoFrame);
        }
    }, [cameraActive, stopCamera]);

    const handleBarcodeSubmit = async (codeToSubmit = barcode) => {
        if (!codeToSubmit) {
            toast.error('Please enter a barcode number');
            return;
        }

        setIsScanning(true);

        try {
            const response = await fetch(`/api/barcode/${codeToSubmit}`);
            const result = await response.json();

            if (result.success && result.data) {
                const { 
                    name, brands, calories, protein, fat, carbs,
                    vitamin_a, vitamin_b1, vitamin_b2, vitamin_b3, 
                    vitamin_b6, vitamin_b9, vitamin_b12, 
                    vitamin_c, vitamin_d, vitamin_e, vitamin_k 
                } = result.data;
                const displayName = brands ? `${brands} - ${name}` : name;
                
                onFoodRecognized({
                    name: displayName,
                    calories: Math.round(Number(calories) || 0),
                    protein: Math.round(Number(protein) || 0),
                    carbs: Math.round(Number(carbs) || 0),
                    fats: Math.round(Number(fat) || 0),
                    time: new Date().toTimeString().slice(0, 5),
                    vitamin_a: Number(vitamin_a) || 0,
                    vitamin_b1: Number(vitamin_b1) || 0,
                    vitamin_b2: Number(vitamin_b2) || 0,
                    vitamin_b3: Number(vitamin_b3) || 0,
                    vitamin_b6: Number(vitamin_b6) || 0,
                    vitamin_b9: Number(vitamin_b9) || 0,
                    vitamin_b12: Number(vitamin_b12) || 0,
                    vitamin_c: Number(vitamin_c) || 0,
                    vitamin_d: Number(vitamin_d) || 0,
                    vitamin_e: Number(vitamin_e) || 0,
                    vitamin_k: Number(vitamin_k) || 0
                });
                
                toast.success('Product found from Open Food Facts DB!');
                setBarcode('');
            } else {
                toast.error(result.error || 'Product not found in local database');
            }
        } catch (err) {
            console.error(err);
            toast.error('Error fetching barcode from database');
        } finally {
            setIsScanning(false);
        }
    };

    if (cameraActive) {
        return (
            <div className="space-y-4">
                <div className="relative rounded-xl overflow-hidden bg-black aspect-[4/3]">
                    <video
                        ref={videoRef}
                        playsInline
                        muted
                        className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 pointer-events-none">
                        <div className="absolute inset-y-1/3 inset-x-8 border-2 border-red-500/50 rounded-xl" />
                        <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-red-500/80 animate-pulse shadow-[0_0_10px_rgba(239,68,68,0.8)]" />
                    </div>
                </div>
                <Button variant="outline" className="w-full h-11" onClick={stopCamera}>
                    Cancel Scan
                </Button>
            </div>
        );
    }

    return (
        <div className="space-y-5">
            <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-blue-500/10 via-sky-500/10 to-indigo-500/10 border border-blue-500/20 p-4">
                <div className="relative flex items-start gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-indigo-500 shadow-lg shadow-blue-500/25">
                        <Scan className="h-5 w-5 text-white" />
                    </div>
                    <div>
                        <h4 className="font-semibold text-sm">Barcode Database</h4>
                        <p className="text-xs text-muted-foreground mt-0.5">
                            Powered by Open Food Facts. Scan or enter a product barcode to log its calories and macros.
                        </p>
                    </div>
                </div>
            </div>

            <div className="space-y-4">
                <div className="space-y-2">
                    <Label htmlFor="barcode-input">Enter Barcode Manually</Label>
                    <div className="flex gap-2">
                        <Input
                            id="barcode-input"
                            placeholder="e.g. 0000101209159"
                            value={barcode}
                            onChange={(e) => setBarcode(e.target.value.replace(/[^0-9]/g, ''))}
                            disabled={isScanning}
                            className="flex-1"
                        />
                        <Button 
                            onClick={() => handleBarcodeSubmit(barcode)} 
                            disabled={isScanning || !barcode}
                            className="bg-blue-600 hover:bg-blue-700 text-white"
                        >
                            {isScanning ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                        </Button>
                    </div>
                </div>

                <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-border/50"></div>
                    </div>
                    <div className="relative flex justify-center text-xs">
                        <span className="bg-background px-2 text-muted-foreground">OR</span>
                    </div>
                </div>

                <div className="space-y-2">
                    <Label>Scan with Camera</Label>
                    <button
                        onClick={startCamera}
                        className="w-full group relative cursor-pointer rounded-xl border-2 border-dashed border-muted-foreground/25 hover:border-blue-500/50 transition-all duration-300 p-8 text-center"
                    >
                        <div className="absolute inset-0 rounded-xl bg-gradient-to-b from-blue-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                        <div className="relative space-y-3">
                            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-muted/50 group-hover:bg-blue-500/10 transition-colors">
                                <Scan className="h-8 w-8 text-muted-foreground group-hover:text-blue-500 transition-colors" />
                            </div>
                            <div>
                                <p className="text-sm font-medium">Click to scan a barcode</p>
                                <p className="text-xs text-muted-foreground mt-1">Requires camera permission</p>
                            </div>
                        </div>
                    </button>
                    {(!('BarcodeDetector' in window)) && (
                        <p className="text-[10px] text-amber-500 text-center mt-2">
                            Note: Native Barcode detection may not be disabled/supported in this browser. If scanning fails, enter code manually.
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
}
