import { Blog } from "@/models/Blog";

function basicSlugify(text: string) {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

export async function generateUniqueSlug(title: string) {
  const baseSlug = basicSlugify(title) || "blog";

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