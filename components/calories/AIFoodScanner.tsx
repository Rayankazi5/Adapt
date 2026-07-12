import { useState, useRef, useCallback, useEffect } from 'react';
import { Camera, Upload, X, Sparkles, Check, RotateCcw, Zap, ChevronDown, ChevronUp } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '../ui/button';
import { classifyImage, fileToImage, captureVideoFrame, teachModel, savePortionCorrection, type ClassificationResult } from '../../lib/foodClassifier';
import { getAllFoodNames, getNutritionByLabel } from '../../data/foodNutritionData';

interface AIFoodScannerProps {
    onFoodRecognized: (food: {
        name: string;
        calories: number;
        protein: number;
        carbs: number;
        fats: number;
        time: string;
        vitamin_a?: number;
        vitamin_b1?: number;
        vitamin_b2?: number;
        vitamin_b3?: number;
        vitamin_b6?: number;
        vitamin_b9?: number;
        vitamin_b12?: number;
        vitamin_c?: number;
        vitamin_d?: number;
        vitamin_e?: number;
        vitamin_k?: number;
    }) => void;
    isProcessing?: boolean;
}

type ScannerState = 'idle' | 'camera' | 'preview' | 'analyzing' | 'results';

export function AIFoodScanner({ onFoodRecognized }: AIFoodScannerProps) {
    const [scannerState, setScannerState] = useState<ScannerState>('idle');
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [results, setResults] = useState<ClassificationResult[]>([]);
    const [selectedResult, setSelectedResult] = useState<number>(0);
    const [showAllResults, setShowAllResults] = useState(false);
    const [grams, setGrams] = useState(100);
    const [cameraError, setCameraError] = useState<string | null>(null);
    const [isCorrecting, setIsCorrecting] = useState(false);
    const [correctionQuery, setCorrectionQuery] = useState('');
    const [selectedCorrectionFood, setSelectedCorrectionFood] = useState<string | null>(null);
    const [correctionGrams, setCorrectionGrams] = useState('');

    useEffect(() => {
        const topResult = results[selectedResult];
        if (topResult?.estimatedGrams) {
            setGrams(topResult.estimatedGrams);
        } else if (topResult?.nutrition) {
            // Fallback: use serving size if no estimatedGrams
            setGrams(topResult.nutrition.servingSize);
        }
    }, [selectedResult, results]);

    const inputRef = useRef<HTMLInputElement>(null);
    const videoRef = useRef<HTMLVideoElement>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);

    // Cleanup camera on unmount
    useEffect(() => {
        return () => {
            if (streamRef.current) {
                streamRef.current.getTracks().forEach(t => t.stop());
            }
        };
    }, []);

    const handleFileSelect = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = () => {
            setImagePreview(reader.result as string);
            setScannerState('preview');
        };
        reader.readAsDataURL(file);
    }, []);

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        const file = e.dataTransfer.files?.[0];
        if (file && file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onload = () => {
                setImagePreview(reader.result as string);
                setScannerState('preview');
            };
            reader.readAsDataURL(file);
        }
    }, []);

    const handleDragOver = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
    }, []);

    const startCamera = useCallback(async () => {
        setCameraError(null);
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: 'environment', width: { ideal: 640 }, height: { ideal: 480 } }
            });
            streamRef.current = stream;
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
                await videoRef.current.play();
            }
            setScannerState('camera');
        } catch {
            setCameraError('Camera access denied. Please allow camera access or upload an image instead.');
        }
    }, []);

    const capturePhoto = useCallback(() => {
        if (!videoRef.current) return;
        const canvas = captureVideoFrame(videoRef.current);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
        setImagePreview(dataUrl);

        if (streamRef.current) {
            streamRef.current.getTracks().forEach(t => t.stop());
            streamRef.current = null;
        }
        setScannerState('preview');
    }, []);

    const analyzeImage = useCallback(async () => {
        if (!imagePreview) return;

        setScannerState('analyzing');

        try {
            const img = await fileToImage(
                await fetch(imagePreview).then(r => r.blob()).then(b => new File([b], 'photo.jpg', { type: 'image/jpeg' }))
            );
            const predictions = await classifyImage(img);
            setResults(predictions);
            setSelectedResult(0);

            // setGrams relies on the useEffect based on `results` so we skip it here
            setScannerState('results');
        } catch (err) {
            console.error('Classification error:', err);
            setScannerState('preview');
        }
    }, [imagePreview]);

    const resetScanner = useCallback(() => {
        setImagePreview(null);
        setResults([]);
        setSelectedResult(0);
        setGrams(100);
        setCameraError(null);
        setIsCorrecting(false);
        setCorrectionQuery('');
        setSelectedCorrectionFood(null);
        setCorrectionGrams('');
        setScannerState('idle');
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(t => t.stop());
            streamRef.current = null;
        }
    }, []);

    const handleConfirm = useCallback(() => {
        const result = results[selectedResult];
        console.log("handleConfirm triggered! Result: ", result);
        if (!result?.nutrition) {
            console.error("Missing nutrition info on result:", result);
            toast.error("Missing nutrition info for this food.");
            return;
        }

        const n = result.nutrition;
        
        // Safety guard against NaN
        const safeGrams = Number.isNaN(grams) ? n.servingSize || 100 : grams;
        const servings = safeGrams / n.servingSize;
        
        console.log(`Adding ${safeGrams}g, servings=${servings}. Nutrition:`, n);
        
        try {
            onFoodRecognized({
                name: n.displayName,
                calories: Math.round(n.calories * servings) || 0,
                protein: Math.round(n.protein * servings) || 0,
                carbs: Math.round(n.carbs * servings) || 0,
                fats: Math.round(n.fats * servings) || 0,
                time: new Date().toTimeString().slice(0, 5),
                vitamin_a: n.vitamin_a ? (n.vitamin_a * servings) : 0,
                vitamin_b1: n.vitamin_b1 ? (n.vitamin_b1 * servings) : 0,
                vitamin_b2: n.vitamin_b2 ? (n.vitamin_b2 * servings) : 0,
                vitamin_b3: n.vitamin_b3 ? (n.vitamin_b3 * servings) : 0,
                vitamin_b6: n.vitamin_b6 ? (n.vitamin_b6 * servings) : 0,
                vitamin_b9: n.vitamin_b9 ? (n.vitamin_b9 * servings) : 0,
                vitamin_b12: n.vitamin_b12 ? (n.vitamin_b12 * servings) : 0,
                vitamin_c: n.vitamin_c ? (n.vitamin_c * servings) : 0,
                vitamin_d: n.vitamin_d ? (n.vitamin_d * servings) : 0,
                vitamin_e: n.vitamin_e ? (n.vitamin_e * servings) : 0,
                vitamin_k: n.vitamin_k ? (n.vitamin_k * servings) : 0,
            });
            console.log("Successfully called onFoodRecognized!");
        } catch (e) {
            console.error("Error calling onFoodRecognized:", e);
            toast.error("Failed to add food to log.");
        }
        
        // LEARN PORTION SIZE from normal usage logs
        savePortionCorrection(result.label, safeGrams);
        
        resetScanner();
    }, [results, selectedResult, grams, onFoodRecognized, resetScanner]);

    const handleCorrectionSubmit = async (correctName: string, portionGrams?: number) => {
        if (!imagePreview) return;

        try {
            const img = await fileToImage(
                await fetch(imagePreview).then(r => r.blob()).then(b => new File([b], 'photo.jpg', { type: 'image/jpeg' }))
            );

            const learningToast = toast.loading(`Teaching AI to recognize ${correctName}...`);
            
            try {
                await teachModel(correctName, img);
                
                // Save portion correction if the user provided grams
                if (portionGrams && portionGrams > 0) {
                    savePortionCorrection(correctName.toLowerCase(), portionGrams);
                }

                const allNames = getAllFoodNames();
                const realName = allNames.find(n => n.toLowerCase() === correctName.toLowerCase()) || correctName;

                const nutrition = getNutritionByLabel(realName);
                const correctedResult: ClassificationResult = {
                    label: realName.toLowerCase(),
                    displayName: realName,
                    confidence: 1.0,
                    nutrition,
                    estimatedMultiplier: results[0]?.estimatedMultiplier || 1,
                    estimatedGrams: portionGrams || results[0]?.estimatedGrams
                };

                setResults([correctedResult, ...results]);
                setSelectedResult(0);
                setIsCorrecting(false);
                setCorrectionQuery('');
                setSelectedCorrectionFood(null);
                setCorrectionGrams('');
                if (portionGrams) {
                    setGrams(portionGrams);
                }
                
                toast.dismiss(learningToast);
                toast.success(`Success! I've learned that this is ${realName}.`, {
                    description: "This correction is now saved to your device's AI brain.",
                    duration: 5000,
                });
            } catch (trainErr) {
                toast.dismiss(learningToast);
                throw trainErr;
            }
        } catch (e) {
            console.error('Failed to teach model:', e);
            toast.error('Training Failed', {
                description: e instanceof Error ? e.message : 'The AI model could not be updated at this time.',
            });
        }
    };

    // ─── IDLE STATE ─────────────────────────────────────────────
    if (scannerState === 'idle') {
        return (
            <div className="space-y-4">
                {/* AI Badge */}
                <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-violet-500/10 via-purple-500/10 to-fuchsia-500/10 border border-violet-500/20 p-4">
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(139,92,246,0.12),transparent_50%)]" />
                    <div className="relative flex items-start gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-fuchsia-500 shadow-lg shadow-violet-500/25">
                            <Sparkles className="h-5 w-5 text-white" />
                        </div>
                        <div>
                            <h4 className="font-semibold text-sm">AI Food Recognition</h4>
                            <p className="text-xs text-muted-foreground mt-0.5">
                                Upload a photo of your Indian food and our AI will identify it and calculate the nutritional content instantly.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Upload Area */}
                <div
                    onDrop={handleDrop}
                    onDragOver={handleDragOver}
                    onClick={() => inputRef.current?.click()}
                    className="group relative cursor-pointer rounded-xl border-2 border-dashed border-muted-foreground/25 hover:border-violet-500/50 transition-all duration-300 p-8 text-center"
                >
                    <div className="absolute inset-0 rounded-xl bg-gradient-to-b from-violet-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                    <div className="relative space-y-3">
                        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-muted/50 group-hover:bg-violet-500/10 transition-colors">
                            <Upload className="h-7 w-7 text-muted-foreground group-hover:text-violet-500 transition-colors" />
                        </div>
                        <div>
                            <p className="text-sm font-medium">Drop your food photo here</p>
                            <p className="text-xs text-muted-foreground mt-1">or click to browse • JPG, PNG, WebP</p>
                        </div>
                    </div>
                    <input
                        ref={inputRef}
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        className="hidden"
                        onChange={handleFileSelect}
                    />
                </div>

                {/* Camera Button */}
                <Button
                    variant="outline"
                    className="w-full gap-2 h-12 rounded-xl border-muted-foreground/25 hover:border-violet-500/50 hover:bg-violet-500/5"
                    onClick={startCamera}
                >
                    <Camera className="h-4 w-4" />
                    Use Camera
                </Button>

                {cameraError && (
                    <p className="text-xs text-destructive text-center">{cameraError}</p>
                )}

                {/* Food Categories Preview */}
                <div className="rounded-xl bg-muted/30 p-3">
                    <p className="text-xs font-medium text-muted-foreground mb-2">Recognizes 101 global & Indian food categories:</p>
                    <div className="flex flex-wrap gap-1.5">
                        {['Pizza', 'Burger', 'Sushi', 'Biryani', 'Dosa', 'Steak', 'Ramen', 'Pasta', 'Tacos', 'Salad'].map(food => (
                            <span key={food} className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-violet-500/10 text-violet-700 dark:text-violet-300">
                                {food}
                            </span>
                        ))}
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-muted text-muted-foreground">
                            +91 more
                        </span>
                    </div>
                </div>
            </div>
        );
    }

    // ─── CAMERA STATE ───────────────────────────────────────────
    if (scannerState === 'camera') {
        return (
            <div className="space-y-4">
                <div className="relative rounded-xl overflow-hidden bg-black aspect-[4/3]">
                    <video
                        ref={videoRef}
                        autoPlay
                        playsInline
                        muted
                        className="w-full h-full object-cover"
                    />
                    {/* Camera overlay with viewfinder */}
                    <div className="absolute inset-0 pointer-events-none">
                        <div className="absolute inset-8 border-2 border-white/30 rounded-2xl" />
                        <div className="absolute top-8 left-8 w-6 h-6 border-t-2 border-l-2 border-white rounded-tl-lg" />
                        <div className="absolute top-8 right-8 w-6 h-6 border-t-2 border-r-2 border-white rounded-tr-lg" />
                        <div className="absolute bottom-8 left-8 w-6 h-6 border-b-2 border-l-2 border-white rounded-bl-lg" />
                        <div className="absolute bottom-8 right-8 w-6 h-6 border-b-2 border-r-2 border-white rounded-br-lg" />
                    </div>
                    <p className="absolute bottom-3 left-0 right-0 text-center text-xs text-white/70">
                        Position food in the frame
                    </p>
                </div>
                <div className="flex gap-3">
                    <Button variant="outline" className="flex-1 rounded-xl h-11" onClick={resetScanner}>
                        <X className="h-4 w-4 mr-2" /> Cancel
                    </Button>
                    <Button className="flex-1 rounded-xl h-11 bg-gradient-to-r from-violet-500 to-fuchsia-500 hover:from-violet-600 hover:to-fuchsia-600 text-white border-0" onClick={capturePhoto}>
                        <Camera className="h-4 w-4 mr-2" /> Capture
                    </Button>
                </div>
                <canvas ref={canvasRef} className="hidden" />
            </div>
        );
    }

    // ─── PREVIEW STATE ──────────────────────────────────────────
    if (scannerState === 'preview') {
        return (
            <div className="space-y-4">
                <div className="relative rounded-xl overflow-hidden bg-muted aspect-[4/3]">
                    {imagePreview && (
                        <img src={imagePreview} alt="Food preview" className="w-full h-full object-cover" />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                </div>
                <div className="flex gap-3">
                    <Button variant="outline" className="flex-1 rounded-xl h-11" onClick={resetScanner}>
                        <RotateCcw className="h-4 w-4 mr-2" /> Retake
                    </Button>
                    <Button
                        className="flex-1 rounded-xl h-11 bg-gradient-to-r from-violet-500 to-fuchsia-500 hover:from-violet-600 hover:to-fuchsia-600 text-white border-0"
                        onClick={analyzeImage}
                    >
                        <Zap className="h-4 w-4 mr-2" /> Analyze Food
                    </Button>
                </div>
            </div>
        );
    }

    // ─── ANALYZING STATE ────────────────────────────────────────
    if (scannerState === 'analyzing') {
        return (
            <div className="space-y-4">
                <div className="relative rounded-xl overflow-hidden bg-muted aspect-[4/3]">
                    {imagePreview && (
                        <img src={imagePreview} alt="Analyzing" className="w-full h-full object-cover" />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-black/20 flex items-center justify-center">
                        <div className="text-center space-y-3">
                            <div className="relative mx-auto w-16 h-16">
                                <div className="absolute inset-0 rounded-full border-4 border-white/20" />
                                <div className="absolute inset-0 rounded-full border-4 border-t-white border-r-transparent border-b-transparent border-l-transparent animate-spin" />
                                <Sparkles className="absolute inset-0 m-auto h-6 w-6 text-white animate-pulse" />
                            </div>
                            <div>
                                <p className="text-white text-sm font-medium">Analyzing Food...</p>
                                <p className="text-white/60 text-xs mt-1">Identifying ingredients & nutrition</p>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="space-y-2">
                    <div className="flex justify-between text-xs text-muted-foreground">
                        <span>Processing image</span>
                        <span>Please wait</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                        <div className="h-full rounded-full bg-gradient-to-r from-violet-500 to-fuchsia-500 animate-pulse" style={{ width: '60%' }} />
                    </div>
                </div>
            </div>
        );
    }

    // ─── RESULTS STATE ──────────────────────────────────────────
    const topResult = results[selectedResult];
    const nutrition = topResult?.nutrition;

    const servings = nutrition ? grams / nutrition.servingSize : 1;

    return (
        <div className="space-y-4">
            {/* Image + result overlay */}
            <div className="relative rounded-xl overflow-hidden bg-muted aspect-[16/10]">
                {imagePreview && (
                    <img src={imagePreview} alt="Food" className="w-full h-full object-cover" />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-4">
                    <div className="flex items-center gap-2 mb-1">
                        <div className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                        <span className="text-emerald-400 text-xs font-medium uppercase tracking-wider">Identified</span>
                    </div>
                    <h3 className="text-white text-xl font-bold">{topResult?.displayName}</h3>
                    <p className="text-white/60 text-xs mt-0.5">
                        {Math.round(topResult?.confidence * 100)}% confidence
                        {nutrition && ` • ${nutrition.servingSize}${nutrition.servingUnit}`}
                    </p>
                </div>
            </div>

            {/* Nutrition Card */}
            {nutrition && (
                <div className="rounded-xl bg-gradient-to-br from-muted/50 to-muted/30 border border-border/50 p-4 space-y-4">
                    {/* Calorie Bar */}
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-xs text-muted-foreground">Calories</p>
                            <p className="text-2xl font-bold bg-gradient-to-r from-orange-500 to-red-500 bg-clip-text text-transparent">
                                {Math.round(nutrition.calories * servings)}
                            </p>
                        </div>
                        <div className="text-right">
                            <p className="text-xs text-muted-foreground">Portion (g)</p>
                            <div className="flex items-center gap-2 mt-1">
                                <button
                                    className="h-7 w-7 rounded-lg bg-muted hover:bg-muted/80 flex items-center justify-center text-sm font-bold transition-colors"
                                    onClick={() => setGrams(Math.max(10, grams - 10))}
                                >−</button>
                                <span className="text-sm font-semibold w-12 text-center">{grams}g</span>
                                <button
                                    className="h-7 w-7 rounded-lg bg-muted hover:bg-muted/80 flex items-center justify-center text-sm font-bold transition-colors"
                                    onClick={() => setGrams(grams + 10)}
                                >+</button>
                            </div>
                        </div>
                    </div>

                    {/* Macro Bars */}
                    <div className="space-y-2.5">
                        <MacroBar label="Protein" value={Math.round(nutrition.protein * servings)} unit="g" color="from-blue-500 to-cyan-500" percentage={(nutrition.protein * 4 / nutrition.calories) * 100} />
                        <MacroBar label="Carbs" value={Math.round(nutrition.carbs * servings)} unit="g" color="from-amber-500 to-orange-500" percentage={(nutrition.carbs * 4 / nutrition.calories) * 100} />
                        <MacroBar label="Fats" value={Math.round(nutrition.fats * servings)} unit="g" color="from-pink-500 to-rose-500" percentage={(nutrition.fats * 9 / nutrition.calories) * 100} />
                        <MacroBar label="Fiber" value={Math.round(nutrition.fiber * servings)} unit="g" color="from-emerald-500 to-green-500" percentage={Math.min((nutrition.fiber / 10) * 100, 100)} />
                    </div>
                </div>
            )}

            {/* Other predictions */}
            {results.length > 1 && (
                <div className="space-y-2">
                    <button
                        onClick={() => setShowAllResults(!showAllResults)}
                        className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
                    >
                        {showAllResults ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                        {showAllResults ? 'Hide' : 'Show'} other predictions
                    </button>
                    {showAllResults && (
                        <div className="space-y-1.5">
                            {results.map((r, i) => (
                                <button
                                    key={r.label}
                                    onClick={() => setSelectedResult(i)}
                                    className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-all ${i === selectedResult
                                        ? 'bg-violet-500/10 border border-violet-500/30 text-violet-700 dark:text-violet-300'
                                        : 'bg-muted/30 hover:bg-muted/50 text-muted-foreground'
                                        }`}
                                >
                                    <span className="font-medium">{r.displayName}</span>
                                    <span className="text-xs">{Math.round(r.confidence * 100)}%</span>
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* Correction UI */}
            {isCorrecting ? (
                <div className="space-y-3 p-4 border border-violet-500/30 rounded-xl bg-violet-500/5">
                    {!selectedCorrectionFood ? (
                        <>
                            <p className="text-sm font-medium">Step 1: What food is this?</p>
                            <div className="relative">
                                <input
                                    type="text"
                                    className="w-full h-10 px-3 text-sm rounded-lg border bg-background"
                                    placeholder="Type to search foods..."
                                    value={correctionQuery}
                                    onChange={(e) => setCorrectionQuery(e.target.value)}
                                    autoFocus
                                />
                                {correctionQuery.length > 0 && (
                                    <div className="absolute z-10 w-full mt-1 max-h-40 overflow-auto rounded-lg border bg-popover shadow-lg">
                                        {getAllFoodNames()
                                            .filter(n => n.toLowerCase().includes(correctionQuery.toLowerCase()))
                                            .slice(0, 5)
                                            .map(name => (
                                                <button
                                                    key={name}
                                                    onClick={() => {
                                                        setSelectedCorrectionFood(name);
                                                        setCorrectionQuery(name);
                                                    }}
                                                    className="w-full px-3 py-2 text-left text-sm hover:bg-muted transition-colors"
                                                >
                                                    {name}
                                                </button>
                                            ))}
                                    </div>
                                )}
                            </div>
                        </>
                    ) : (
                        <>
                            <div className="flex items-center justify-between">
                                <p className="text-sm font-medium">Food: <span className="text-violet-500">{selectedCorrectionFood}</span></p>
                                <button
                                    onClick={() => { setSelectedCorrectionFood(null); setCorrectionQuery(''); }}
                                    className="text-xs text-muted-foreground hover:text-foreground"
                                >Change</button>
                            </div>
                            <div>
                                <label className="text-xs text-muted-foreground">Step 2: Correct portion size (grams)</label>
                                <div className="flex items-center gap-2 mt-1">
                                    <input
                                        type="number"
                                        className="flex-1 h-10 px-3 text-sm rounded-lg border bg-background"
                                        placeholder="e.g. 400"
                                        value={correctionGrams}
                                        onChange={(e) => setCorrectionGrams(e.target.value)}
                                        autoFocus
                                        min={10}
                                    />
                                    <span className="text-sm text-muted-foreground">g</span>
                                </div>
                            </div>
                            <Button
                                className="w-full rounded-lg h-10 bg-gradient-to-r from-violet-500 to-fuchsia-500 hover:from-violet-600 hover:to-fuchsia-600 text-white border-0"
                                onClick={() => handleCorrectionSubmit(
                                    selectedCorrectionFood,
                                    correctionGrams ? parseInt(correctionGrams) : undefined
                                )}
                            >
                                <Sparkles className="h-4 w-4 mr-2" />
                                Teach AI
                            </Button>
                        </>
                    )}
                    <Button variant="ghost" className="w-full text-xs h-8" onClick={() => { setIsCorrecting(false); setSelectedCorrectionFood(null); setCorrectionQuery(''); setCorrectionGrams(''); }}>
                        Cancel
                    </Button>
                </div>
            ) : (
                <button
                    onClick={() => setIsCorrecting(true)}
                    className="w-full text-center text-xs text-muted-foreground hover:text-violet-500 transition-colors py-1"
                >
                    Wrong prediction? Teach the AI.
                </button>
            )}

            {/* Action buttons */}
            <div className="flex gap-3 mt-2">
                <Button variant="outline" className="flex-1 rounded-xl h-11" onClick={resetScanner}>
                    <RotateCcw className="h-4 w-4 mr-2" /> Scan Again
                </Button>
                <Button
                    className="flex-1 rounded-xl h-11 bg-gradient-to-r from-emerald-500 to-green-500 hover:from-emerald-600 hover:to-green-600 text-white border-0"
                    onClick={handleConfirm}
                    disabled={!nutrition}
                >
                    <Check className="h-4 w-4 mr-2" /> Add Food
                </Button>
            </div>
        </div>
    );
}

// ─── Macro Bar Sub-Component ────────────────────────────────
function MacroBar({ label, value, unit, color, percentage }: {
    label: string;
    value: number;
    unit: string;
    color: string;
    percentage: number;
}) {
    return (
        <div className="space-y-1">
            <div className="flex justify-between items-center">
                <span className="text-xs font-medium">{label}</span>
                <span className="text-xs text-muted-foreground">{value}{unit}</span>
            </div>
            <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                <div
                    className={`h-full rounded-full bg-gradient-to-r ${color} transition-all duration-500`}
                    style={{ width: `${Math.min(percentage, 100)}%` }}
                />
            </div>
        </div>
    );
}
