import { Schema, model, models } from "mongoose";

function slugify(text: string) {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-");
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
  if (this.isModified("name")) {
    this.slug = slugify(this.name);
  }
});


export const Category =
  models.Category || model("Category", CategorySchema);
