export const parseJson = (json: string) => {
  const jsonStart = json.indexOf('{');
  const jsonEnd = json.lastIndexOf('}') + 1;

  if (jsonStart === -1 || jsonEnd === -1) {
    throw new Error('No valid JSON object found in response');
  }
  return JSON.parse(json.slice(jsonStart, jsonEnd));
};
