// src/game/utils.ts
export const getMessageText = (data: any): Promise<string> => {
    return new Promise((resolve, reject) => {
        if (typeof data === "string") {
            resolve(data);
        } else if (data instanceof Blob) {
            const reader = new FileReader();
            reader.onload = () => {
                resolve(reader.result as string);
            };
            reader.onerror = () => reject(new Error("Error reading Blob"));
            reader.readAsText(data);
        } else {
            resolve(data.toString());
        }
    });
};
