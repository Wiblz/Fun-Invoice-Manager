import {z} from "zod";

const ALLOWED_FILE_EXTENSIONS = ['pdf'];
const MAX_FILE_SIZE = 10 * 1024 * 1024;

export const fileSchema = z.instanceof(File).superRefine((file, ctx) => {
  const fileExtension = file.name.split('.').pop()?.toLowerCase();
  if (!fileExtension || !ALLOWED_FILE_EXTENSIONS.includes(fileExtension)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: `File type not allowed. Allowed types are: ${ALLOWED_FILE_EXTENSIONS.join(', ')}`,
    });
  }

  if (file.size > MAX_FILE_SIZE) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: `File size exceeds the maximum limit of ${MAX_FILE_SIZE / 1024 / 1024}MB`,
    });
  }
});
