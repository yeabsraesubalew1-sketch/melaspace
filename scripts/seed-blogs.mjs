import path from "node:path";
import { fileURLToPath } from "node:url";
import mongoose from "mongoose";
import dotenv from "dotenv";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

for (const envPath of [
  path.resolve(__dirname, "../.env.local"),
  path.resolve(__dirname, "../.env"),
]) {
  dotenv.config({ path: envPath });
}

function printHelp() {
  console.log(`
Usage: npm run seed:blogs [--format=<json|markdown|editorjs>] [--help]

Available formats:
  json      Use rich Editor.js-style blog content (default)
  markdown  Convert markdown text into paragraph blocks
  editorjs  Use prebuilt Editor.js JSON blocks

Examples:
  npm run seed:blogs
  npm run seed:blogs -- --format=markdown
  npm run seed:blogs -- --help
`);
}

function parseArgs(argv) {
  const args = { format: "json" };

  for (const arg of argv) {
    if (arg === "--help" || arg === "-h") {
      args.help = true;
      continue;
    }

    if (arg.startsWith("--format=")) {
      const value = arg.split("=")[1];
      if (["json", "markdown", "editorjs"].includes(value)) {
        args.format = value;
      } else {
        throw new Error(`Unsupported format: ${value}`);
      }
    }
  }

  return args;
}

function buildEditorContent(format) {
  const baseParagraph =
    "A practical guide to building a thoughtful content strategy that feels useful, clear, and human.";

  if (format === "markdown") {
    return {
      time: Date.now(),
      blocks: [
        {
          id: "markdown-paragraph",
          type: "paragraph",
          data: {
            text: `# Welcome to the blog\n\n${baseParagraph}\n\n- Start with the reader's problem\n- Show a clear example\n- End with a next step`,
          },
        },
      ],
    };
  }

  if (format === "editorjs") {
    return {
      time: Date.now(),
      blocks: [
        {
          id: "editorjs-heading",
          type: "header",
          data: { level: 2, text: "A flexible publishing workflow" },
        },
        {
          id: "editorjs-paragraph",
          type: "paragraph",
          data: { text: baseParagraph },
        },
        {
          id: "editorjs-list",
          type: "list",
          data: {
            style: "unordered",
            items: [
              "Plan content around real questions",
              "Make every post easy to scan",
              "Publish consistently without friction",
            ],
          },
        },
      ],
    };
  }

  return {
    time: Date.now(),
    blocks: [
      {
        id: "hero-heading",
        type: "header",
        data: { level: 2, text: "Why thoughtful publishing still matters" },
      },
      {
        id: "hero-paragraph",
        type: "paragraph",
        data: { text: baseParagraph },
      },
      {
        id: "hero-quote",
        type: "quote",
        data: {
          text: "Good content helps readers make confident decisions.",
          caption: "Mela Space",
          alignment: "left",
        },
      },
    ],
  };
}

function createSeedBlogs(format) {
  const commonContent = buildEditorContent(format);

  return [
    {
      title: "How to build a calm content system",
      slug: "how-to-build-a-calm-content-system",
      excerpt:
        "A simple framework for creating posts that feel useful, focused, and easy to follow.",
      content: commonContent,
      categories: ["strategy", "content"],
      status: "published",
      publishedAt: new Date("2026-07-01T09:00:00.000Z"),
    },
    {
      title: "The case for human-centered publishing",
      slug: "the-case-for-human-centered-publishing",
      excerpt:
        "Why clarity and empathy often matter more than clever formatting.",
      content: buildEditorContent(format),
      categories: ["brand", "writing"],
      status: "published",
      publishedAt: new Date("2026-07-05T12:30:00.000Z"),
    },
    {
      title: "A practical checklist for shipping great posts",
      slug: "a-practical-checklist-for-shipping-great-posts",
      excerpt:
        "A lightweight workflow that helps your team publish with less friction.",
      content: buildEditorContent(format),
      categories: ["operations", "content"],
      status: "draft",
    },
  ];
}

async function ensureCategory(categoryName, slug, db) {
  const existing = await db.collection("categories").findOne({ slug });

  if (existing) {
    return existing._id;
  }

  const result = await db
    .collection("categories")
    .insertOne({ name: categoryName, slug });
  return result.insertedId;
}

async function main() {
  try {
    const args = parseArgs(process.argv.slice(2));

    if (args.help) {
      printHelp();
      process.exit(0);
    }

    const uri = process.env.MONGODB_URI;

    if (!uri) {
      console.error(
        "MONGODB_URI is not set. Add it to your environment before running the seed script.",
      );
      process.exit(1);
    }

    console.log(`Seeding blogs with the ${args.format} format...`);

    await mongoose.connect(uri, { bufferCommands: false });

    const db = mongoose.connection.db;
    if (!db) {
      throw new Error("Database connection is not available.");
    }

    const blogsToInsert = createSeedBlogs(args.format);
    const categoryIds = new Map();

    for (const blog of blogsToInsert) {
      const resolvedCategoryIds = [];

      for (const categorySlug of blog.categories) {
        const categoryName =
          categorySlug.charAt(0).toUpperCase() + categorySlug.slice(1);
        let categoryId = categoryIds.get(categorySlug);

        if (!categoryId) {
          categoryId = await ensureCategory(categoryName, categorySlug, db);
          categoryIds.set(categorySlug, categoryId);
        }

        resolvedCategoryIds.push(categoryId);
      }

      await db
        .collection("blogs")
        .updateOne(
          { slug: blog.slug },
          { $setOnInsert: { ...blog, categories: resolvedCategoryIds } },
          { upsert: true },
        );
    }

    console.log(`Inserted or updated ${blogsToInsert.length} blog documents.`);
    console.log(
      "Tip: run npm run seed:blogs -- --format=markdown or --format=editorjs to try other content layouts.",
    );
  } catch (error) {
    console.error(
      "Blog seeding failed:",
      error instanceof Error ? error.message : error,
    );
    process.exit(1);
  } finally {
    await mongoose.disconnect();
  }
}

main();
