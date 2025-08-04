export async function fetchLogsFromS3Browser(fileList: string[]) {
  const S3_BASE_URL = "https://call-transcripts-01.s3.amazonaws.com/transcripts/";

  const results = await Promise.all(
    fileList.map(async (file) => {
      const res = await fetch(`${S3_BASE_URL}${file}`);
      const text = await res.text();
      return { file, text };
    })
  );

  return results; // array of { file, text }
}
