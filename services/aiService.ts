
// AI features have been disabled.
// This file is kept as a placeholder to avoid breaking imports if any were missed,
// but the functionality is removed.

export interface AIResponse {
  options: string[];
  tags: string[];
}

export const generatePollOptions = async (topic: string): Promise<AIResponse> => {
  console.warn("AI generation is disabled.");
  return { options: [], tags: [] };
};
