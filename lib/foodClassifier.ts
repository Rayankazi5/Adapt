import * as tf from '@tensorflow/tfjs';
import { CLASS_LABELS, getNutritionByLabel, type FoodNutritionInfo } from '../data/foodNutritionData';

export interface ClassificationResult {
    label: string;
    displayName: string;
    confidence: number;
    nutrition: FoodNutritionInfo | undefined;
    estimatedMultiplier?: number;
    estimatedGrams?: number;
}

// ─── Model State ────────────────────────────────────────────
let customModel: tf.LayersModel | null = null;
let mobilenetModel: tf.LayersModel | null = null;
let isModelLoading = false;

const CUSTOM_MODEL_URL = '/models/food-classifier/model.json';
const MOBILENET_URL = 'https://storage.googleapis.com/tfjs-models/tfjs/mobilenet_v1_0.25_224/model.json';
const IMAGE_SIZE = 224;

// ─── ImageNet → Indian Food Mapping ─────────────────────────
// Maps ImageNet class labels to our 20 Indian food categories with weights.
const IMAGENET_TO_INDIAN_FOOD: Record<string, { target: string; weight: number }[]> = {
    // Rice dishes
    'plate': [{ target: 'biriyani', weight: 0.15 }, { target: 'bisibelebath', weight: 0.1 }, { target: 'ven pongal', weight: 0.1 }],
    'carbonara': [{ target: 'noodles', weight: 0.7 }, { target: 'biriyani', weight: 0.1 }],
    'meat_loaf': [{ target: 'tandoori chicken', weight: 0.5 }],
    'potpie': [{ target: 'samosa', weight: 0.5 }],
    'burrito': [{ target: 'kathi roll', weight: 0.6 }, { target: 'dosa', weight: 0.2 }],
    'pizza': [{ target: 'butternaan', weight: 0.4 }, { target: 'chappati', weight: 0.2 }],
    'french_loaf': [{ target: 'butternaan', weight: 0.5 }, { target: 'chappati', weight: 0.3 }],
    'bagel': [{ target: 'meduvadai', weight: 0.5 }, { target: 'dahi vada', weight: 0.3 }, { target: 'paniyaram', weight: 0.2 }],
    'pretzel': [{ target: 'meduvadai', weight: 0.4 }],
    'cheeseburger': [{ target: 'vada pav', weight: 0.7 }],
    'hotdog': [{ target: 'kathi roll', weight: 0.5 }],
    'mashed_potato': [{ target: 'upma', weight: 0.4 }, { target: 'ven pongal', weight: 0.3 }, { target: 'dahi vada', weight: 0.3 }],
    'guacamole': [{ target: 'chaat', weight: 0.3 }, { target: 'dahi vada', weight: 0.3 }, { target: 'upma', weight: 0.2 }],
    'trifle': [{ target: 'halwa', weight: 0.4 }, { target: 'dahi vada', weight: 0.3 }, { target: 'gulab jamun', weight: 0.2 }],
    'ice_cream': [{ target: 'gulab jamun', weight: 0.3 }, { target: 'halwa', weight: 0.3 }],
    'chocolate_sauce': [{ target: 'gulab jamun', weight: 0.5 }, { target: 'halwa', weight: 0.3 }],
    'dough': [{ target: 'chappati', weight: 0.4 }, { target: 'butternaan', weight: 0.3 }, { target: 'poori', weight: 0.2 }],
    'pancake': [{ target: 'dosa', weight: 0.7 }, { target: 'chappati', weight: 0.2 }],
    'waffle': [{ target: 'dosa', weight: 0.4 }, { target: 'paniyaram', weight: 0.3 }],
    'eggnog': [{ target: 'halwa', weight: 0.3 }],
    'frying_pan': [{ target: 'dosa', weight: 0.3 }, { target: 'chappati', weight: 0.2 }],
    'wok': [{ target: 'noodles', weight: 0.4 }, { target: 'biriyani', weight: 0.2 }],
    'spatula': [{ target: 'dosa', weight: 0.3 }],
    'soup_bowl': [{ target: 'bisibelebath', weight: 0.4 }, { target: 'ven pongal', weight: 0.3 }, { target: 'upma', weight: 0.2 }],
    'consomme': [{ target: 'bisibelebath', weight: 0.4 }, { target: 'ven pongal', weight: 0.3 }],
    'mushroom': [{ target: 'biriyani', weight: 0.2 }],
    'bell_pepper': [{ target: 'biriyani', weight: 0.2 }, { target: 'noodles', weight: 0.2 }],
    'cucumber': [{ target: 'chaat', weight: 0.3 }],
    'head_cabbage': [{ target: 'noodles', weight: 0.2 }],
    'cauliflower': [{ target: 'samosa', weight: 0.2 }, { target: 'chaat', weight: 0.2 }],
    'corn': [{ target: 'chaat', weight: 0.3 }],
    'drumstick': [{ target: 'tandoori chicken', weight: 0.7 }],
    'hen': [{ target: 'tandoori chicken', weight: 0.6 }],
    'cock': [{ target: 'tandoori chicken', weight: 0.5 }],
    'pomegranate': [{ target: 'chaat', weight: 0.3 }],
    'lemon': [{ target: 'chaat', weight: 0.2 }],
    'chocolate_cake': [{ target: 'halwa', weight: 0.4 }, { target: 'gulab jamun', weight: 0.3 }],
    'spaghetti': [{ target: 'noodles', weight: 0.8 }],
    'dumpling': [{ target: 'paniyaram', weight: 0.5 }, { target: 'meduvadai', weight: 0.3 }],
    'croissant': [{ target: 'samosa', weight: 0.4 }],
    'tortilla': [{ target: 'dosa', weight: 0.5 }, { target: 'chappati', weight: 0.4 }],
    'crepe': [{ target: 'dosa', weight: 0.8 }],
    'taco': [{ target: 'dosa', weight: 0.3 }, { target: 'kathi roll', weight: 0.3 }],
    'donut': [{ target: 'meduvadai', weight: 0.7 }],
    'doughnut': [{ target: 'meduvadai', weight: 0.7 }],
    'bread': [{ target: 'butternaan', weight: 0.4 }, { target: 'poori', weight: 0.3 }],
    'roll': [{ target: 'kathi roll', weight: 0.5 }],
    'sandwich': [{ target: 'vada pav', weight: 0.5 }],
    'brown_bread': [{ target: 'chappati', weight: 0.5 }],
    'fig': [{ target: 'gulab jamun', weight: 0.3 }],
    'strawberry': [{ target: 'gulab jamun', weight: 0.2 }],
    'custard': [{ target: 'halwa', weight: 0.4 }, { target: 'dahi vada', weight: 0.3 }],
    'pudding': [{ target: 'halwa', weight: 0.4 }, { target: 'dahi vada', weight: 0.3 }, { target: 'gulab jamun', weight: 0.2 }],
    'bubble': [{ target: 'poori', weight: 0.4 }, { target: 'paniyaram', weight: 0.2 }],
    'balloon': [{ target: 'poori', weight: 0.5 }],
    'bakery': [{ target: 'dhokla', weight: 0.3 }, { target: 'butternaan', weight: 0.2 }],
    'broccoli': [{ target: 'chaat', weight: 0.2 }, { target: 'upma', weight: 0.2 }],
    'zucchini': [{ target: 'dhokla', weight: 0.3 }],
    'spaghetti_squash': [{ target: 'noodles', weight: 0.5 }],
};

// ─── Visual Feature Profiles ────────────────────────────────
// Fine-tuned visual profiles for each dish using HSL color space.
// [hue_center, hue_tolerance], [sat_min, sat_max], [light_min, light_max],
// texture_density, roundness, color_variance
interface FoodVisualProfile {
    hue: [number, number];
    saturation: [number, number];
    lightness: [number, number];
    textureLevel: number;
    roundness: number;
    colorVariance: number;
}

const FOOD_VISUAL_PROFILES: Record<string, FoodVisualProfile> = {
    'biriyani': { hue: [40, 30], saturation: [0.3, 0.7], lightness: [0.35, 0.6], textureLevel: 0.6, roundness: 0.3, colorVariance: 0.7 },
    'bisibelebath': { hue: [30, 25], saturation: [0.3, 0.6], lightness: [0.3, 0.55], textureLevel: 0.5, roundness: 0.3, colorVariance: 0.5 },
    'butternaan': { hue: [30, 20], saturation: [0.2, 0.5], lightness: [0.45, 0.75], textureLevel: 0.4, roundness: 0.5, colorVariance: 0.3 },
    'chaat': { hue: [25, 35], saturation: [0.3, 0.7], lightness: [0.3, 0.6], textureLevel: 0.7, roundness: 0.3, colorVariance: 0.8 },
    'chappati': { hue: [30, 15], saturation: [0.15, 0.4], lightness: [0.4, 0.7], textureLevel: 0.3, roundness: 0.8, colorVariance: 0.2 },
    'dhokla': { hue: [50, 15], saturation: [0.4, 0.7], lightness: [0.5, 0.75], textureLevel: 0.3, roundness: 0.4, colorVariance: 0.2 },
    'dosa': { hue: [35, 20], saturation: [0.15, 0.4], lightness: [0.45, 0.8], textureLevel: 0.3, roundness: 0.4, colorVariance: 0.3 },
    'gulab jamun': { hue: [20, 15], saturation: [0.4, 0.8], lightness: [0.2, 0.45], textureLevel: 0.2, roundness: 0.9, colorVariance: 0.2 },
    'halwa': { hue: [25, 20], saturation: [0.3, 0.7], lightness: [0.3, 0.55], textureLevel: 0.2, roundness: 0.3, colorVariance: 0.3 },
    'idly': { hue: [0, 180], saturation: [0.0, 0.15], lightness: [0.7, 0.95], textureLevel: 0.15, roundness: 0.9, colorVariance: 0.1 },
    'kathi roll': { hue: [35, 20], saturation: [0.3, 0.6], lightness: [0.35, 0.6], textureLevel: 0.5, roundness: 0.2, colorVariance: 0.5 },
    'meduvadai': { hue: [25, 20], saturation: [0.3, 0.7], lightness: [0.25, 0.5], textureLevel: 0.5, roundness: 0.9, colorVariance: 0.3 },
    'noodles': { hue: [40, 25], saturation: [0.2, 0.5], lightness: [0.35, 0.6], textureLevel: 0.8, roundness: 0.1, colorVariance: 0.5 },
    'paniyaram': { hue: [25, 20], saturation: [0.2, 0.5], lightness: [0.3, 0.6], textureLevel: 0.3, roundness: 0.9, colorVariance: 0.2 },
    'poori': { hue: [30, 20], saturation: [0.3, 0.6], lightness: [0.35, 0.6], textureLevel: 0.3, roundness: 0.8, colorVariance: 0.2 },
    'samosa': { hue: [35, 15], saturation: [0.3, 0.6], lightness: [0.35, 0.6], textureLevel: 0.4, roundness: 0.3, colorVariance: 0.3 },
    'tandoori chicken': { hue: [10, 20], saturation: [0.5, 0.9], lightness: [0.2, 0.45], textureLevel: 0.6, roundness: 0.4, colorVariance: 0.4 },
    'upma': { hue: [45, 20], saturation: [0.15, 0.4], lightness: [0.45, 0.7], textureLevel: 0.4, roundness: 0.3, colorVariance: 0.3 },
    'vada pav': { hue: [30, 20], saturation: [0.3, 0.6], lightness: [0.35, 0.55], textureLevel: 0.4, roundness: 0.6, colorVariance: 0.4 },
    'ven pongal': { hue: [45, 20], saturation: [0.15, 0.35], lightness: [0.45, 0.7], textureLevel: 0.3, roundness: 0.3, colorVariance: 0.2 },
    'dahi vada': { hue: [30, 20], saturation: [0.1, 0.4], lightness: [0.6, 0.85], textureLevel: 0.4, roundness: 0.7, colorVariance: 0.5 },
};

// ─── ImageNet 1000 labels (food-relevant subset) ────────────
const IMAGENET_LABELS: Record<number, string> = {
    7: 'cock', 8: 'hen',
    417: 'balloon', 504: 'coffee_mug', 532: 'dining_table',
    567: 'frying_pan', 572: 'goblet',
    610: 'ice_cream', 659: 'ladle',
    720: 'mixing_bowl', 762: 'orange', 784: 'plate',
    801: 'pretzel', 809: 'drumstick', 813: 'restaurant',
    842: 'soup_bowl', 846: 'spatula', 859: 'stove',
    880: 'trifle', 881: 'custard', 882: 'chocolate_cake',
    883: 'donut', 884: 'bread', 885: 'brown_bread',
    886: 'roll', 887: 'tortilla', 888: 'crepe',
    889: 'taco', 890: 'pancake', 891: 'waffle',
    924: 'guacamole', 925: 'consomme',
    926: 'hotdog', 927: 'cheeseburger', 928: 'mashed_potato',
    929: 'head_cabbage', 930: 'broccoli', 931: 'cauliflower',
    932: 'zucchini', 933: 'spaghetti_squash',
    936: 'cucumber', 938: 'bell_pepper', 940: 'mushroom',
    942: 'strawberry', 943: 'orange', 944: 'lemon',
    945: 'fig', 947: 'banana', 949: 'custard_apple',
    950: 'pomegranate', 952: 'carbonara', 953: 'chocolate_sauce',
    954: 'dough', 955: 'meat_loaf', 956: 'pizza',
    957: 'potpie', 958: 'burrito', 960: 'eggnog',
    962: 'bubble', 978: 'corn', 991: 'bakery',
};

// ─── Load Models ────────────────────────────────────────────

const INDEXEDDB_URL = 'indexeddb://food-classifier-custom-v1';

export async function loadModel(): Promise<boolean> {
    if (customModel) return true;
    if (isModelLoading) {
        return new Promise((resolve) => {
            const check = setInterval(() => {
                if (!isModelLoading) {
                    clearInterval(check);
                    resolve(customModel !== null);
                }
            }, 200);
        });
    }

    isModelLoading = true;
    
    // 1. Try to load from IndexedDB (user-trained model)
    try {
        customModel = await tf.loadLayersModel(INDEXEDDB_URL);
        console.log('✅ Loaded user-trained model from IndexedDB');
        isModelLoading = false;
        return true;
    } catch (e) {
        console.log('ℹ️ No user-trained model found in IndexedDB, falling back to static model');
    }

    // 2. Try to load from Static URL (project model)
    try {
        customModel = await tf.loadLayersModel(CUSTOM_MODEL_URL);
        console.log('✅ Loaded static project model');
        isModelLoading = false;
        return true;
    } catch (e) {
        console.warn('⚠️ Static custom model not found at', CUSTOM_MODEL_URL);
        isModelLoading = false;
        return false;
    }
}

async function loadMobileNet(): Promise<tf.LayersModel | null> {
    if (mobilenetModel) return mobilenetModel;
    try {
        mobilenetModel = await tf.loadLayersModel(MOBILENET_URL);
        console.log('✅ MobileNet loaded for fallback classification');
        return mobilenetModel;
    } catch {
        console.warn('⚠️ MobileNet failed to load (offline?)');
        return null;
    }
}

// ─── Image Preprocessing ────────────────────────────────────

function preprocessImage(imgElement: HTMLImageElement | HTMLCanvasElement): tf.Tensor4D {
    return tf.tidy(() => {
        let tensor = tf.browser.fromPixels(imgElement);
        tensor = tf.image.resizeBilinear(tensor as tf.Tensor3D, [IMAGE_SIZE, IMAGE_SIZE]);
        const normalized = tensor.div(255.0);
        return normalized.expandDims(0) as tf.Tensor4D;
    });
}

// ─── Main Classification Entry ──────────────────────────────

export async function classifyImage(
    imgElement: HTMLImageElement | HTMLCanvasElement
): Promise<ClassificationResult[]> {
    const hasCustomModel = await loadModel();
    if (hasCustomModel && customModel) {
        return classifyWithCustomModel(imgElement);
    }
    return classifyWithMobileNetFallback(imgElement);
}

// ─── Custom Model Classification ────────────────────────────

async function classifyWithCustomModel(
    imgElement: HTMLImageElement | HTMLCanvasElement
): Promise<ClassificationResult[]> {
    // Check Image Memory First!
    const fingerprint = getVisualFingerprint(imgElement);
    const memoryMatch = findMemoryMatch(fingerprint);

    if (memoryMatch) {
        console.log(`🧠 Image Memory Match Found! Distance: ${memoryMatch.distance}`);
        const nutrition = getNutritionByLabel(memoryMatch.label);
        console.log(`Diagnostic: memoryMatch.label = '${memoryMatch.label}', nutrition =`, nutrition);
        const multiplierResult = estimatePortionMultiplier(imgElement, memoryMatch.label);
        return [{
            label: memoryMatch.label,
            displayName: nutrition?.displayName || formatFoodLabel(memoryMatch.label),
            confidence: 0.99,
            nutrition,
            estimatedMultiplier: multiplierResult.multiplier,
            estimatedGrams: multiplierResult.estimatedGrams
        }];
    }

    const inputTensor = preprocessImage(imgElement);
    const predictions = customModel!.predict(inputTensor) as tf.Tensor;
    const [probabilitiesData, visualScores] = await Promise.all([
        predictions.data(),
        getVisualFeatureScores(imgElement, fingerprint)
    ]);
    const probabilities = Array.from(probabilitiesData);
    inputTensor.dispose();
    predictions.dispose();

    const outputSize = probabilities.length;
    const finalScores = new Map<string, number>();

    // Calculate max model confidence to determine uncertainty
    let maxModelProb = 0;
    for (const p of probabilities) {
        if (p > maxModelProb) maxModelProb = p;
    }
    
    // When the model is uncertain (e.g., after being taught an extended class),
    // we boost the power of visual heuristics for those extended classes.
    const uncertaintyBoost = Math.max(0, 1.0 - maxModelProb);

    for (let i = 0; i < CLASS_LABELS.length; i++) {
        const label = CLASS_LABELS[i];
        const modelProb = i < outputSize ? probabilities[i] : 0;
        const visualProb = visualScores[label] || 0;

        let combined = 0;
        if (i < outputSize) {
            // For known classes (<= 101), trust the model heavily, with a dash of visual features
            combined = (modelProb * 0.85) + (visualProb * 0.15);
        } else {
            // For extended classes (Indian foods), the NN has no output neuron.
            // They rely on visual features, scaled by how uncertain the NN is about the known classes.
            combined = visualProb * uncertaintyBoost;
        }

        finalScores.set(label, combined);
    }

    const sortedLabels = Array.from(finalScores.keys()).sort((a, b) => finalScores.get(b)! - finalScores.get(a)!);
    const topLabel = sortedLabels[0] || '';
    const multiplierResult = estimatePortionMultiplier(imgElement, topLabel);
    const multiplier = multiplierResult.multiplier;

    const results: ClassificationResult[] = [];
    for (const label of sortedLabels.slice(0, 5)) {
        const prob = finalScores.get(label) || 0;
        const nutrition = getNutritionByLabel(label);
        const labelResult = label === topLabel ? multiplierResult : estimatePortionMultiplier(imgElement, label);
        results.push({
            label,
            displayName: nutrition?.displayName || formatFoodLabel(label),
            confidence: prob,
            nutrition,
            estimatedMultiplier: multiplier,
            estimatedGrams: labelResult.estimatedGrams
        });
    }

    const totalConf = results.reduce((acc, r) => acc + r.confidence, 0);
    if (totalConf > 0) {
        results.forEach(r => r.confidence /= totalConf);
    }
    return results;
}

// Format a snake_case food label into a display name
function formatFoodLabel(label: string): string {
    return label
        .replace(/_/g, ' ')
        .replace(/\b\w/g, c => c.toUpperCase());
}

// ─── MobileNet + Visual Features Fallback ───────────────────

async function classifyWithMobileNetFallback(
    imgElement: HTMLImageElement | HTMLCanvasElement
): Promise<ClassificationResult[]> {
    // Check Image Memory First!
    const fingerprint = getVisualFingerprint(imgElement);
    const memoryMatch = findMemoryMatch(fingerprint);

    if (memoryMatch) {
         console.log(`🧠 Image Memory Match Found (Fallback)! Distance: ${memoryMatch.distance}`);
         const nutrition = getNutritionByLabel(memoryMatch.label);
         const multiplierResult = estimatePortionMultiplier(imgElement, memoryMatch.label);
         return [{
             label: memoryMatch.label,
             displayName: nutrition?.displayName || formatFoodLabel(memoryMatch.label),
             confidence: 0.99,
             nutrition,
             estimatedMultiplier: multiplierResult.multiplier,
             estimatedGrams: multiplierResult.estimatedGrams
         }];
    }

    // Run MobileNet and visual analysis in parallel
    const [mobilenetScores, visualScores] = await Promise.all([
        getMobileNetScores(imgElement),
        getVisualFeatureScores(imgElement, fingerprint),
    ]);

    // Combine: 60% MobileNet, 40% visual features
    const combinedScores: Record<string, number> = {};
    for (const label of CLASS_LABELS) {
        const mn = mobilenetScores[label] || 0;
        const vis = visualScores[label] || 0;
        combinedScores[label] = (mn * 0.6) + (vis * 0.4);
    }

    // Normalize to sum to 1
    const totalScore = Object.values(combinedScores).reduce((a, b) => a + b, 0);
    const sorted = Object.entries(combinedScores)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 5);

    const topLabel = sorted[0]?.[0] || '';
    const multiplierResult = estimatePortionMultiplier(imgElement, topLabel);

    return sorted.map(([label, score]) => {
        const nutrition = getNutritionByLabel(label);
        const labelResult = label === topLabel ? multiplierResult : estimatePortionMultiplier(imgElement, label);
        return {
            label,
            displayName: nutrition?.displayName || label,
            confidence: totalScore > 0 ? score / totalScore : 0.05,
            nutrition,
            estimatedMultiplier: multiplierResult.multiplier,
            estimatedGrams: labelResult.estimatedGrams
        };
    });
}

// ─── MobileNet Score Extraction ─────────────────────────────

async function getMobileNetScores(
    imgElement: HTMLImageElement | HTMLCanvasElement
): Promise<Record<string, number>> {
    const scores: Record<string, number> = {};
    for (const label of CLASS_LABELS) scores[label] = 0;

    const mobileNet = await loadMobileNet();
    if (!mobileNet) return scores; // Return zeros if offline

    try {
        const inputTensor = preprocessImage(imgElement);
        const predictions = mobileNet.predict(inputTensor) as tf.Tensor;
        const logits = await predictions.data();
        inputTensor.dispose();
        predictions.dispose();

        // Softmax to get probabilities
        const logitArr = Array.from(logits) as number[];
        const maxLogit = Math.max(...logitArr);
        const expValues = logitArr.map(v => Math.exp(v - maxLogit));
        const sumExp = expValues.reduce((a, b) => a + b, 0);
        const probs = expValues.map(v => v / sumExp);

        // Get top-50 ImageNet predictions and map to our food categories
        const topIndices = probs
            .map((p, i) => ({ p, i }))
            .sort((a, b) => b.p - a.p)
            .slice(0, 50);

        for (const { p, i } of topIndices) {
            const imagenetLabel = IMAGENET_LABELS[i];
            if (!imagenetLabel) continue;

            // Try each word in the label
            const labelWords = imagenetLabel.toLowerCase().split(/[\s_,]+/);
            for (const word of labelWords) {
                const mappings = IMAGENET_TO_INDIAN_FOOD[word];
                if (mappings) {
                    for (const { target, weight } of mappings) {
                        scores[target] = (scores[target] || 0) + p * weight;
                    }
                }
            }

            // Also try the full label as a key
            const mappings = IMAGENET_TO_INDIAN_FOOD[imagenetLabel];
            if (mappings) {
                for (const { target, weight } of mappings) {
                    scores[target] = (scores[target] || 0) + p * weight * 0.5;
                }
            }
        }

        // Normalize to [0, 1]
        const maxScore = Math.max(...Object.values(scores), 0.001);
        for (const label of CLASS_LABELS) {
            scores[label] /= maxScore;
        }
    } catch (err) {
        console.warn('MobileNet inference failed:', err);
    }

    return scores;
}

// ─── Visual Feature Analysis & Memory ───────────────────────

export interface VisualFingerprint {
    avgHue: number;
    avgSat: number;
    avgLight: number;
    colorVariance: number;
    textureDensity: number;
    roundness: number;
}

export function getVisualFingerprint(imgElement: HTMLImageElement | HTMLCanvasElement): VisualFingerprint {
    const canvas = document.createElement('canvas');
    const SIZE = 64;
    canvas.width = SIZE;
    canvas.height = SIZE;
    const ctx = canvas.getContext('2d')!;
    ctx.drawImage(imgElement, 0, 0, SIZE, SIZE);
    const imageData = ctx.getImageData(0, 0, SIZE, SIZE).data;

    // Convert all pixels to HSL
    const hslPixels: { h: number; s: number; l: number }[] = [];
    for (let i = 0; i < imageData.length; i += 4) {
        hslPixels.push(rgbToHsl(imageData[i] / 255, imageData[i + 1] / 255, imageData[i + 2] / 255));
    }

    // Compute image-level features
    const avgHue = circularMean(hslPixels.map(p => p.h));
    const avgSat = mean(hslPixels.map(p => p.s));
    const avgLight = mean(hslPixels.map(p => p.l));

    const satVar = variance(hslPixels.map(p => p.s));
    const lightVar = variance(hslPixels.map(p => p.l));
    const colorVariance = Math.min(1, Math.sqrt(satVar + lightVar) * 3);

    // Texture: horizontal gradient magnitude
    let edgeSum = 0;
    for (let y = 0; y < SIZE; y++) {
        for (let x = 1; x < SIZE - 1; x++) {
            const idx = (y * SIZE + x) * 4;
            const left = (imageData[idx - 4] + imageData[idx - 3] + imageData[idx - 2]) / 3;
            const right = (imageData[idx + 4] + imageData[idx + 5] + imageData[idx + 6]) / 3;
            edgeSum += Math.abs(right - left);
        }
    }
    const textureDensity = Math.min(1, edgeSum / (SIZE * SIZE * 40));

    // Roundness: center vs edge lightness difference
    const centerPixels = hslPixels.filter((_, i) => {
        const x = (i % SIZE) - SIZE / 2;
        const y = Math.floor(i / SIZE) - SIZE / 2;
        return Math.sqrt(x * x + y * y) < SIZE * 0.3;
    });
    const edgePixels = hslPixels.filter((_, i) => {
        const x = (i % SIZE) - SIZE / 2;
        const y = Math.floor(i / SIZE) - SIZE / 2;
        return Math.sqrt(x * x + y * y) > SIZE * 0.4;
    });
    const centerLight = mean(centerPixels.map(p => p.l));
    const edgeLight = mean(edgePixels.map(p => p.l));
    const roundness = Math.min(1, Math.max(0, (centerLight - edgeLight + 0.2) * 2));

    return { avgHue, avgSat, avgLight, colorVariance, textureDensity, roundness };
}

// Memory persistence for exact user photo corrections
const IMAGE_MEMORY_KEY = 'adaptify_image_memory';
interface ImageMemoryEntry {
    fingerprint: VisualFingerprint;
    label: string;
    timestamp: number;
}

export function saveImageCorrection(imgElement: HTMLImageElement | HTMLCanvasElement, label: string) {
    const fingerprint = getVisualFingerprint(imgElement);
    const canonicalLabel = getCanonicalFoodId(label);
    try {
        const store: ImageMemoryEntry[] = JSON.parse(localStorage.getItem(IMAGE_MEMORY_KEY) || '[]');
        // Don't add duplicate exact same memories
        const duplicate = store.find(e => circularDistance(e.fingerprint.avgHue, fingerprint.avgHue, 360) < 1 
            && Math.abs(e.fingerprint.avgSat - fingerprint.avgSat) < 0.01);
        if (!duplicate) {
            store.push({ fingerprint, label: canonicalLabel, timestamp: Date.now() });
            if (store.length > 50) store.shift(); // Keep last 50
            localStorage.setItem(IMAGE_MEMORY_KEY, JSON.stringify(store));
        }
    } catch (e) {
        console.warn('Failed to save image correction:', e);
    }
}

export function findMemoryMatch(fingerprint: VisualFingerprint): { label: string, distance: number } | null {
    try {
        const store: ImageMemoryEntry[] = JSON.parse(localStorage.getItem(IMAGE_MEMORY_KEY) || '[]');
        if (store.length === 0) return null;

        let bestMatch = null;
        let minDistance = 0.35; // Relaxed threshold to catch new photos of the same food (different angles/lighting)

        for (const entry of store) {
            const fp = entry.fingerprint;
            const hueDist = circularDistance(fingerprint.avgHue, fp.avgHue, 360) / 180;
            const satDist = Math.abs(fingerprint.avgSat - fp.avgSat);
            const lightDist = Math.abs(fingerprint.avgLight - fp.avgLight);
            const texDist = Math.abs(fingerprint.textureDensity - fp.textureDensity);
            
            // Texture and color must be heavily matching
            const distance = (hueDist * 1.5) + satDist + lightDist + texDist;
            if (distance < minDistance) {
                minDistance = distance;
                bestMatch = entry;
            }
        }

        return bestMatch ? { label: bestMatch.label, distance: minDistance } : null;
    } catch {
        return null;
    }
}

async function getVisualFeatureScores(
    imgElement: HTMLImageElement | HTMLCanvasElement,
    fingerprintOverride?: VisualFingerprint
): Promise<Record<string, number>> {
    const fp = fingerprintOverride || getVisualFingerprint(imgElement);
    const { avgHue, avgSat, avgLight, colorVariance, textureDensity, roundness } = fp;

    // Score each food based on visual similarity to its profile
    const scores: Record<string, number> = {};
    for (const label of CLASS_LABELS) {
        const profile = FOOD_VISUAL_PROFILES[label];
        if (!profile) { scores[label] = 0.05; continue; }

        let score = 0;

        // Hue match (circular distance)
        const hueDist = circularDistance(avgHue, profile.hue[0], 360);
        score += Math.max(0, 1 - hueDist / profile.hue[1]) * 0.25;

        // Saturation match
        if (avgSat >= profile.saturation[0] && avgSat <= profile.saturation[1]) {
            score += 0.2;
        } else {
            const satDist = Math.min(
                Math.abs(avgSat - profile.saturation[0]),
                Math.abs(avgSat - profile.saturation[1])
            );
            score += Math.max(0, 0.2 - satDist * 0.5);
        }

        // Lightness match
        if (avgLight >= profile.lightness[0] && avgLight <= profile.lightness[1]) {
            score += 0.2;
        } else {
            const lightDist = Math.min(
                Math.abs(avgLight - profile.lightness[0]),
                Math.abs(avgLight - profile.lightness[1])
            );
            score += Math.max(0, 0.2 - lightDist * 0.5);
        }

        // Texture match
        score += Math.max(0, 0.15 - Math.abs(textureDensity - profile.textureLevel) * 0.3);

        // Roundness match
        score += Math.max(0, 0.1 - Math.abs(roundness - profile.roundness) * 0.2);

        // Color variance match
        score += Math.max(0, 0.1 - Math.abs(colorVariance - profile.colorVariance) * 0.2);

        scores[label] = Math.max(0.01, score);
    }

    // Normalize to [0, 1]
    const maxScore = Math.max(...Object.values(scores));
    for (const label of CLASS_LABELS) {
        scores[label] /= maxScore;
    }

    return scores;
}

// ─── Food Portion Profiles ──────────────────────────────────
// Defines how to estimate portion size for each food type.
// 'discrete' foods = countable items (idli, samosa, vada)
// 'continuous' foods = plate/bowl based (biryani, noodles)
interface FoodPortionProfile {
    type: 'discrete' | 'continuous';
    unitWeightG: number;       // Weight of 1 unit in grams
    typicalCount: number;      // How many units in a typical serving photo
    minGrams: number;          // Minimum reasonable portion
    maxGrams: number;          // Maximum reasonable portion
    typicalGrams: number;      // Most common real-world portion
}

const FOOD_PORTION_PROFILES: Record<string, FoodPortionProfile> = {
    'biriyani': { type: 'continuous', unitWeightG: 200, typicalCount: 1, minGrams: 150, maxGrams: 400, typicalGrams: 250 },
    'bisibelebath': { type: 'continuous', unitWeightG: 200, typicalCount: 1, minGrams: 150, maxGrams: 350, typicalGrams: 200 },
    'butternaan': { type: 'discrete', unitWeightG: 90, typicalCount: 1, minGrams: 80, maxGrams: 270, typicalGrams: 90 },
    'chaat': { type: 'continuous', unitWeightG: 150, typicalCount: 1, minGrams: 100, maxGrams: 300, typicalGrams: 150 },
    'chappati': { type: 'discrete', unitWeightG: 40, typicalCount: 2, minGrams: 40, maxGrams: 200, typicalGrams: 80 },
    'dahi vada': { type: 'discrete', unitWeightG: 80, typicalCount: 5, minGrams: 150, maxGrams: 500, typicalGrams: 400 },
    'dhokla': { type: 'discrete', unitWeightG: 25, typicalCount: 4, minGrams: 50, maxGrams: 200, typicalGrams: 100 },
    'dosa': { type: 'discrete', unitWeightG: 100, typicalCount: 1, minGrams: 80, maxGrams: 200, typicalGrams: 100 },
    'gulab jamun': { type: 'discrete', unitWeightG: 25, typicalCount: 2, minGrams: 25, maxGrams: 150, typicalGrams: 50 },
    'halwa': { type: 'continuous', unitWeightG: 100, typicalCount: 1, minGrams: 50, maxGrams: 200, typicalGrams: 100 },
    'idly': { type: 'discrete', unitWeightG: 40, typicalCount: 3, minGrams: 40, maxGrams: 200, typicalGrams: 120 },
    'kathi roll': { type: 'discrete', unitWeightG: 180, typicalCount: 1, minGrams: 150, maxGrams: 300, typicalGrams: 180 },
    'meduvadai': { type: 'discrete', unitWeightG: 65, typicalCount: 2, minGrams: 65, maxGrams: 260, typicalGrams: 130 },
    'noodles': { type: 'continuous', unitWeightG: 200, typicalCount: 1, minGrams: 150, maxGrams: 400, typicalGrams: 200 },
    'paniyaram': { type: 'discrete', unitWeightG: 20, typicalCount: 4, minGrams: 40, maxGrams: 160, typicalGrams: 80 },
    'poori': { type: 'discrete', unitWeightG: 30, typicalCount: 2, minGrams: 30, maxGrams: 180, typicalGrams: 60 },
    'samosa': { type: 'discrete', unitWeightG: 100, typicalCount: 1, minGrams: 80, maxGrams: 300, typicalGrams: 100 },
    'tandoori chicken': { type: 'discrete', unitWeightG: 150, typicalCount: 1, minGrams: 100, maxGrams: 400, typicalGrams: 150 },
    'upma': { type: 'continuous', unitWeightG: 200, typicalCount: 1, minGrams: 100, maxGrams: 350, typicalGrams: 200 },
    'vada pav': { type: 'discrete', unitWeightG: 130, typicalCount: 1, minGrams: 100, maxGrams: 260, typicalGrams: 130 },
    'ven pongal': { type: 'continuous', unitWeightG: 200, typicalCount: 1, minGrams: 100, maxGrams: 350, typicalGrams: 200 },
    'grilled chicken breast': { type: 'discrete', unitWeightG: 150, typicalCount: 1, minGrams: 100, maxGrams: 400, typicalGrams: 150 },
    'boiled egg': { type: 'discrete', unitWeightG: 50, typicalCount: 2, minGrams: 50, maxGrams: 200, typicalGrams: 100 },
    'white rice': { type: 'continuous', unitWeightG: 200, typicalCount: 1, minGrams: 100, maxGrams: 400, typicalGrams: 200 },
};

export function estimatePortionMultiplier(
    imgElement: HTMLImageElement | HTMLCanvasElement,
    foodLabel?: string
): { multiplier: number; lightPixelRatio: number; estimatedGrams: number } {
    const canvas = document.createElement('canvas');
    const SIZE = 64;
    canvas.width = SIZE;
    canvas.height = SIZE;
    const ctx = canvas.getContext('2d')!;
    ctx.drawImage(imgElement, 0, 0, SIZE, SIZE);
    const imageData = ctx.getImageData(0, 0, SIZE, SIZE).data;

    let weightedSum = 0;
    let maxPossibleWeight = 0;
    let lightPixels = 0;
    let totalCenterPixels = 0;
    let coloredPixels = 0; // Pixels with actual food color (not bg)

    for (let y = 0; y < SIZE; y++) {
        for (let x = 0; x < SIZE; x++) {
            const dx = (x - SIZE / 2) / (SIZE / 2);
            const dy = (y - SIZE / 2) / (SIZE / 2);
            const dist = Math.sqrt(dx * dx + dy * dy);

            const i = (y * SIZE + x) * 4;
            const r = imageData[i] / 255;
            const g = imageData[i + 1] / 255;
            const b = imageData[i + 2] / 255;

            if (dist < 1.0) {
                const weight = Math.max(0, 1 - dist);
                maxPossibleWeight += weight;
                totalCenterPixels++;

                if (r > 0.6 && g > 0.6 && b > 0.6) {
                    lightPixels++;
                }

                if (r > 0.1 || g > 0.1 || b > 0.1) {
                    weightedSum += weight;
                }

                // Count "food-colored" pixels (not too dark, not pure white bg)
                const maxC = Math.max(r, g, b), minC = Math.min(r, g, b);
                const sat = maxC > 0 ? (maxC - minC) / maxC : 0;
                const lum = (maxC + minC) / 2;
                if ((sat > 0.08 && lum > 0.12 && lum < 0.92) || (lum > 0.5 && lum < 0.88)) {
                    coloredPixels++;
                }
            }
        }
    }

    const coverageRatio = weightedSum / Math.max(1, maxPossibleWeight);
    const lightPixelRatio = lightPixels / Math.max(1, totalCenterPixels);
    const foodCoverageRatio = coloredPixels / Math.max(1, totalCenterPixels);

    // Base multiplier from pixel coverage
    let multiplier = coverageRatio / 0.6;
    multiplier = Math.max(0.5, Math.min(2.5, multiplier));
    multiplier = Math.round(multiplier * 4) / 4;

    // Estimate grams using food-specific profile
    const label = foodLabel?.toLowerCase() || '';
    const profile = FOOD_PORTION_PROFILES[label];

    let estimatedGrams: number;

    if (profile) {
        if (profile.type === 'discrete') {
            // For discrete items: estimate count from food coverage
            // More coverage = more items on the plate
            // foodCoverageRatio ~0.3 = 1 item, ~0.5 = 2 items, ~0.7+ = 3+ items
            let estimatedCount: number;
            if (foodCoverageRatio < 0.25) {
                estimatedCount = 1;
            } else if (foodCoverageRatio < 0.4) {
                estimatedCount = Math.max(1, Math.round(profile.typicalCount * 0.75));
            } else if (foodCoverageRatio < 0.6) {
                estimatedCount = profile.typicalCount;
            } else {
                estimatedCount = Math.ceil(profile.typicalCount * 1.5);
            }

            estimatedGrams = estimatedCount * profile.unitWeightG;
        } else {
            // For continuous/plate foods: scale from typical based on coverage
            // foodCoverageRatio ~0.4 = small portion, ~0.6 = typical, ~0.8+ = large
            let portionScale: number;
            if (foodCoverageRatio < 0.3) {
                portionScale = 0.6;  // Small portion
            } else if (foodCoverageRatio < 0.5) {
                portionScale = 0.8;  // Medium-small
            } else if (foodCoverageRatio < 0.7) {
                portionScale = 1.0;  // Typical
            } else {
                portionScale = 1.3;  // Large
            }

            estimatedGrams = Math.round(profile.typicalGrams * portionScale);
        }

        // Clamp to reasonable range
        estimatedGrams = Math.max(profile.minGrams, Math.min(profile.maxGrams, estimatedGrams));
        // Round to nearest 10g
        estimatedGrams = Math.round(estimatedGrams / 10) * 10;
    } else {
        // Unknown food: fall back to generic 150g estimate
        estimatedGrams = Math.round(150 * multiplier / 10) * 10;
    }

    // Check if the user has provided portion corrections for this food
    const userCorrections = loadPortionCorrections(label);
    if (userCorrections.length > 0) {
        // Use the average of user corrections as the estimate
        const avgGrams = Math.round(userCorrections.reduce((a, b) => a + b, 0) / userCorrections.length);
        estimatedGrams = Math.round(avgGrams / 10) * 10;
    }

    return {
        multiplier,
        lightPixelRatio,
        estimatedGrams
    };
}

// ─── Portion Learning (localStorage) ────────────────────────

const PORTION_STORAGE_KEY = 'adaptify_portion_corrections';

interface PortionCorrectionStore {
    [foodLabel: string]: number[];  // Array of gram values from user corrections
}

function getCanonicalFoodId(label: string): string {
    const n = getNutritionByLabel(label);
    return n ? n.id : label.toLowerCase().trim().replace(/\s+/g, '_');
}

export function savePortionCorrection(foodLabel: string, grams: number): void {
    try {
        const canonicalId = getCanonicalFoodId(foodLabel);
        const store: PortionCorrectionStore = JSON.parse(localStorage.getItem(PORTION_STORAGE_KEY) || '{}');
        if (!store[canonicalId]) {
            store[canonicalId] = [];
        }
        store[canonicalId].push(grams);
        // Keep only the last 10 corrections per food to prevent stale data
        if (store[canonicalId].length > 10) {
            store[canonicalId] = store[canonicalId].slice(-10);
        }
        localStorage.setItem(PORTION_STORAGE_KEY, JSON.stringify(store));
        console.log(`Saved portion correction: ${canonicalId} = ${grams}g (${store[canonicalId].length} samples)`);
    } catch (e) {
        console.warn('Failed to save portion correction:', e);
    }
}

export function loadPortionCorrections(foodLabel: string): number[] {
    try {
        const canonicalId = getCanonicalFoodId(foodLabel);
        const store: PortionCorrectionStore = JSON.parse(localStorage.getItem(PORTION_STORAGE_KEY) || '{}');
        return store[canonicalId] || [];
    } catch {
        return [];
    }
}

function rgbToHsl(r: number, g: number, b: number): { h: number; s: number; l: number } {
    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    const l = (max + min) / 2;
    let h = 0, s = 0;
    if (max !== min) {
        const d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
        switch (max) {
            case r: h = ((g - b) / d + (g < b ? 6 : 0)) * 60; break;
            case g: h = ((b - r) / d + 2) * 60; break;
            case b: h = ((r - g) / d + 4) * 60; break;
        }
    }
    return { h, s, l };
}

function circularDistance(a: number, b: number, period: number): number {
    const d = Math.abs(a - b) % period;
    return Math.min(d, period - d);
}

function circularMean(angles: number[]): number {
    const sinSum = angles.reduce((s, a) => s + Math.sin(a * Math.PI / 180), 0);
    const cosSum = angles.reduce((s, a) => s + Math.cos(a * Math.PI / 180), 0);
    return ((Math.atan2(sinSum, cosSum) * 180 / Math.PI) + 360) % 360;
}

function mean(arr: number[]): number {
    return arr.length > 0 ? arr.reduce((s, v) => s + v, 0) / arr.length : 0;
}

function variance(arr: number[]): number {
    const m = mean(arr);
    return arr.length > 0 ? arr.reduce((s, v) => s + Math.pow(v - m, 2), 0) / arr.length : 0;
}

// ─── Utilities ──────────────────────────────────────────────

export function fileToImage(file: File): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
            const img = new Image();
            img.onload = () => resolve(img);
            img.onerror = reject;
            img.src = reader.result as string;
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}

export function captureVideoFrame(video: HTMLVideoElement): HTMLCanvasElement {
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d')!;
    ctx.drawImage(video, 0, 0);
    return canvas;
}

// ─── Continuous Learning (Fine Tunning) ─────────────────────

export async function teachModel(correctLabel: string, imgElement: HTMLImageElement | HTMLCanvasElement): Promise<void> {
    if (!customModel) {
        // Try to load the model if it hasn't been loaded yet
        await loadModel();

        if (!customModel) {
            throw new Error('Real-time learning requires the primary AI model to be active. It is currently offline or missing.');
        }
    }

    const labelLower = correctLabel.toLowerCase();
    let classIndex = CLASS_LABELS.indexOf(labelLower);

    if (classIndex === -1) {
        // If the label is in the nutrition DB but not CLASS_LABELS, add it to the search list
        const nutrition = getNutritionByLabel(correctLabel);
        if (nutrition) {
            CLASS_LABELS.push(labelLower);
            classIndex = CLASS_LABELS.length - 1;
            console.log(`Dynamic label added to AI tracking: ${labelLower}`);
        } else {
            throw new Error(`Label ${correctLabel} not found in database. Please add it first.`);
        }
    }

    // Always compile the model for training (using Adam optimizer)
    // TF.js requires re-compilation after loading to enable the .fit() method
    try {
        const layers = customModel.layers;
        const lastLayer = layers[layers.length - 1];
        lastLayer.trainable = true;

        customModel.compile({
            optimizer: tf.train.adam(0.005),
            loss: 'categoricalCrossentropy',
            metrics: ['accuracy'],
        });
        console.log('Model compiled for training');
    } catch (e) {
        throw new Error(`Model compilation for continuous learning failed: ${e}`);
    }

    // Yield to let the UI update the "Teaching..." toast/spinner
    await tf.nextFrame();

    const inputTensor = preprocessImage(imgElement);

    const outputShape = customModel.outputs[0].shape as [null, number];
    const outputUnits = outputShape[1] || CLASS_LABELS.length;

    // Create a 1D tensor representing exactly what the model *should* have predicted
    const targetTensor = tf.tidy(() => {
        if (classIndex >= outputUnits) {
            // The model doesn't have a neuron for this newly added class (e.g., Dahi Vada)
            // We teach it to output uniform low probability so it stops confidently guessing the wrong food,
            // allowing our visual heuristics to take over!
            return tf.fill([1, outputUnits], 1.0 / outputUnits);
        }
        return tf.oneHot(tf.tensor1d([classIndex], 'int32'), outputUnits);
    });

    try {
        // Train aggressively (15 epochs) to ensure the model completely overrides its initial bias for this visual pattern
        await customModel.fit(inputTensor, targetTensor, {
            epochs: 15,
            batchSize: 1,
            shuffle: true
        });
        
        // Yield again before the heavy save operation
        await tf.nextFrame();
        
        // ─── PERSISTENCE ───
        // Save the updated model weights to IndexedDB
        console.time('model_save_indexeddb');
        await customModel.save(INDEXEDDB_URL);
        console.timeEnd('model_save_indexeddb');
        
        // Save Exact Image Correction Fingerprint
        saveImageCorrection(imgElement, correctLabel);
        
        console.log(`Model successfully fine-tuned and saved to IndexedDB for ${correctLabel}`);
    } catch (e) {
        console.error('Fine-tuning failed:', e);
        throw new Error(`AI learning phase failed: ${e instanceof Error ? e.message : 'Unknown error'}`);
    } finally {
        inputTensor.dispose();
        targetTensor.dispose();
    }
}
