import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { GoogleGenAI } from "@google/genai";
import { motion, AnimatePresence } from "motion/react";
import { Upload, Palette, Image as ImageIcon, Loader2, RefreshCw, Download } from "lucide-react";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export default function App() {
  const [originalImage, setOriginalImage] = useState<string | null>(null);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        setOriginalImage(reader.result as string);
        setGeneratedImage(null);
        setError(null);
      };
      reader.readAsDataURL(file);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/*': [] } as any,
    multiple: false
  } as any);

  const transformToOilPainting = async () => {
    if (!originalImage) return;

    setIsLoading(true);
    setError(null);

    try {
      const base64Data = originalImage.split(',')[1];
      const mimeType = originalImage.split(';')[0].split(':')[1];

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: {
          parts: [
            {
              inlineData: {
                data: base64Data,
                mimeType: mimeType,
              },
            },
            {
              text: 'Transform this minimalist line drawing into a vibrant, detailed oil painting. Use rich textures, visible brushstrokes, and a warm Mediterranean color palette. The final image should look like a classic oil on canvas masterpiece, maintaining the basic composition of the original sketch.',
            },
          ],
        },
      });

      let foundImage = false;
      const candidates = response.candidates;
      if (candidates && candidates.length > 0) {
        for (const part of candidates[0].content.parts) {
          if (part.inlineData) {
            const base64EncodeString = part.inlineData.data;
            setGeneratedImage(`data:image/png;base64,${base64EncodeString}`);
            foundImage = true;
            break;
          }
        }
      }

      if (!foundImage) {
        setError("The model didn't return an image. Please try again.");
      }
    } catch (err) {
      console.error("Transformation error:", err);
      setError("Failed to transform image. Please check your API key and try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const downloadImage = () => {
    if (!generatedImage) return;
    const link = document.createElement('a');
    link.href = generatedImage;
    link.download = 'oil-painting.png';
    link.click();
  };

  return (
    <div className="min-h-screen bg-stone-50 text-stone-900 font-sans p-6 md:p-12">
      <div className="max-w-6xl mx-auto">
        <header className="mb-12 text-center">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-100 text-amber-800 text-sm font-medium mb-4"
          >
            <Palette size={16} />
            AI Art Studio
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-4xl md:text-6xl font-bold tracking-tight mb-4"
          >
            Line Art to <span className="text-amber-600 italic">Oil Painting</span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-stone-500 text-lg max-w-2xl mx-auto"
          >
            Upload your minimalist sketches and watch them transform into rich, textured oil masterpieces using advanced AI.
          </motion.p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
          {/* Left Column: Upload & Original */}
          <section className="space-y-6">
            <div
              {...getRootProps()}
              className={`relative aspect-square rounded-3xl border-2 border-dashed transition-all duration-300 flex flex-col items-center justify-center p-8 cursor-pointer overflow-hidden
                ${isDragActive ? 'border-amber-500 bg-amber-50' : 'border-stone-200 bg-white hover:border-stone-300 hover:bg-stone-50'}`}
            >
              <input {...getInputProps()} />
              
              {originalImage ? (
                <img
                  src={originalImage}
                  alt="Original"
                  className="absolute inset-0 w-full h-full object-contain p-4"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="text-center space-y-4">
                  <div className="w-16 h-16 bg-stone-100 rounded-2xl flex items-center justify-center mx-auto text-stone-400">
                    <Upload size={32} />
                  </div>
                  <div>
                    <p className="font-medium text-stone-700">Drop your sketch here</p>
                    <p className="text-sm text-stone-400">or click to browse files</p>
                  </div>
                </div>
              )}

              {originalImage && (
                <div className="absolute bottom-4 right-4 flex gap-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setOriginalImage(null);
                      setGeneratedImage(null);
                    }}
                    className="p-2 bg-white/90 backdrop-blur shadow-sm rounded-xl text-stone-600 hover:text-red-500 transition-colors"
                  >
                    <RefreshCw size={20} />
                  </button>
                </div>
              )}
            </div>

            <button
              onClick={transformToOilPainting}
              disabled={!originalImage || isLoading}
              className={`w-full py-4 rounded-2xl font-bold text-lg flex items-center justify-center gap-3 transition-all
                ${!originalImage || isLoading 
                  ? 'bg-stone-200 text-stone-400 cursor-not-allowed' 
                  : 'bg-amber-600 text-white hover:bg-amber-700 shadow-lg hover:shadow-amber-200/50 active:scale-[0.98]'}`}
            >
              {isLoading ? (
                <>
                  <Loader2 className="animate-spin" size={24} />
                  Painting your masterpiece...
                </>
              ) : (
                <>
                  <Palette size={24} />
                  Transform to Oil Painting
                </>
              )}
            </button>

            {error && (
              <motion.p
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-red-500 text-center text-sm font-medium"
              >
                {error}
              </motion.p>
            )}
          </section>

          {/* Right Column: Result */}
          <section className="space-y-6">
            <div className="relative aspect-square rounded-3xl bg-stone-200/50 border border-stone-200 overflow-hidden flex items-center justify-center shadow-inner">
              <AnimatePresence mode="wait">
                {generatedImage ? (
                  <motion.div
                    key="result"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="relative w-full h-full"
                  >
                    <img
                      src={generatedImage}
                      alt="Oil Painting Result"
                      className="w-full h-full object-contain p-4"
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute bottom-4 right-4">
                      <button
                        onClick={downloadImage}
                        className="p-3 bg-white/90 backdrop-blur shadow-lg rounded-2xl text-amber-600 hover:bg-amber-600 hover:text-white transition-all group"
                        title="Download Masterpiece"
                      >
                        <Download size={24} />
                      </button>
                    </div>
                  </motion.div>
                ) : (
                  <motion.div
                    key="placeholder"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-center space-y-4 p-12"
                  >
                    <div className="w-20 h-20 bg-stone-100/50 rounded-3xl flex items-center justify-center mx-auto text-stone-300">
                      <ImageIcon size={40} />
                    </div>
                    <p className="text-stone-400 font-medium max-w-xs mx-auto">
                      Your oil painting will appear here once the transformation is complete.
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>

              {isLoading && (
                <div className="absolute inset-0 bg-white/40 backdrop-blur-[2px] flex items-center justify-center z-10">
                  <div className="bg-white p-6 rounded-3xl shadow-2xl flex flex-col items-center gap-4">
                    <div className="relative">
                      <Loader2 className="animate-spin text-amber-600" size={48} />
                      <Palette className="absolute inset-0 m-auto text-amber-600/50" size={20} />
                    </div>
                    <p className="font-bold text-stone-700">Applying brushstrokes...</p>
                  </div>
                </div>
              )}
            </div>

            <div className="bg-amber-50 rounded-2xl p-6 border border-amber-100">
              <h3 className="font-bold text-amber-900 mb-2 flex items-center gap-2">
                <ImageIcon size={18} />
                About the Transformation
              </h3>
              <p className="text-amber-800/70 text-sm leading-relaxed">
                Our AI analyzes the lines and composition of your sketch, then reimagines it using classical oil painting techniques. It adds depth, texture, and a sophisticated color palette while preserving your original artistic vision.
              </p>
            </div>
          </section>
        </div>
      </div>

      <footer className="mt-20 text-center text-stone-400 text-sm pb-12">
        <p>© 2026 AI Art Studio • Powered by Gemini 2.5 Flash</p>
      </footer>
    </div>
  );
}
