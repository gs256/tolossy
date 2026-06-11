export interface ConvertResponse {
  success: boolean;
  message: string;
}

export class CoreApi {
  public readonly url = "http://localhost:2479";

  async convert(file: File): Promise<ConvertResponse> {
    try {
      {
        const response = await this.upload(file);
        if (!response.ok) {
          return { success: false, message: await response.text() };
        }
      }
      {
        const response = await fetch(
          `${this.url}/api/convert?name=${file.name}`,
        );
        const text = await response.text();
        return { success: response.ok, message: text };
      }
    } catch {
      return { success: false, message: "failed to connect to the server" };
    }
  }

  private async upload(file: File) {
    return await fetch(`${this.url}/api/upload?name=${file.name}`, {
      method: "POST",
      body: file,
      headers: { "content-type": file.type },
    });
  }
}
