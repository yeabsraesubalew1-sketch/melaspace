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
  const baseSlug = basicSlugify(title);

  let slug = baseSlug;
  let counter = 1;

  while (await Blog.exists({ slug })) {
    slug = `${baseSlug}-${counter}`;
    counter++;
  }

  return slug;
}