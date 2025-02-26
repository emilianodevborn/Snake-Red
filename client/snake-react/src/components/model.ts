// src/model.ts
import * as ort from 'onnxruntime-web';

export async function loadModel(difficulty: string): Promise<ort.InferenceSession> {
    // Asegúrate de que 'model_hard.onnx' esté en la carpeta public o en una ruta accesible
    const session = await ort.InferenceSession.create(`model_${difficulty}.onnx`);
    console.log("Modelo ONNX cargado");
    return session;
}

export async function predict(session: ort.InferenceSession, state: number[]): Promise<Float32Array> {
    // Convertir el array de state a un Float32Array y crear un tensor con forma [1, state.length]
    const inputTensor = new ort.Tensor('float32', Float32Array.from(state), [1, state.length]);
    // El nombre 'input' debe coincidir con el nombre del input en el modelo ONNX
    const feeds: Record<string, ort.Tensor> = { 'onnx::Gemm_0': inputTensor };
    const results = await session.run(feeds);
    // Suponemos que la salida se llama 'output' en el modelo ONNX
    const outputTensor = results["7"];
    return outputTensor.data as Float32Array;
}
