import { Schema, model, models } from "mongoose";

function slugify(text: string) {
  const cleaned = text
    .toLowerCase()
    .trim()
    .replace(/[^\p{L}\p{N}\s-]/gu, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
  return cleaned || `category-${Date.now().toString(36)}`;
}

const CategorySchema = new Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    slug: {
      type: String,
      unique: true,
      index: true,
    },
  },
  { timestamps: true }
);

// Auto-generate slug before save
CategorySchema.pre("save", function () {
  if (this.isModified("name") || !this.slug) {
    this.slug = slugify(this.name);
  }
});


export const Category =
  models.Category || model("Category", CategorySchema);
