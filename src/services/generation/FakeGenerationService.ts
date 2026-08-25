import type { GenerationRequest } from "../../domain/generation/Generation";
import type { GenerationService } from "./GenerationService";

export class FakeGenerationService implements GenerationService {
  readonly requests: GenerationRequest[] = [];
  private readonly resultText: string;

  constructor(resultText = "테스트 생성 결과") {
    this.resultText = resultText;
  }

  async generate(_apiKey: string, request: GenerationRequest) {
    this.requests.push(request);
    return { text: this.resultText, attempts: 1 };
  }
}
