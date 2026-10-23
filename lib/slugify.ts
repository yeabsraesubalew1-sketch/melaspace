import { Blog } from "@/models/Blog";

function basicSlugify(text: string) {
  return text
    .toLowerCase()
    .trim()
    // Supports Unicode letters (\p{L} includes Ethiopic, Latin, etc.) and numbers (\p{N})
    .replace(/[^\p{L}\p{N}\s-]/gu, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

export async function generateUniqueSlug(title: string, preferredSlug?: string) {
  const candidate = (preferredSlug && basicSlugify(preferredSlug)) || basicSlugify(title);
  const baseSlug = candidate || "blog";

  let slug = baseSlug;
  let counter = 1;

  try {
    while (await Blog.exists({ slug })) {
      slug = `${baseSlug}-${counter}`;
      counter++;
    }

    return slug;
  } catch (error) {
    console.warn("Falling back to a non-DB slug because MongoDB is unavailable", error);
    return `${baseSlug}-${Date.now().toString(36)}`;
  }
}