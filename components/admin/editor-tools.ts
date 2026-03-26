import Header from "@editorjs/header";
import List from "@editorjs/list";
import Quote from "@editorjs/quote";
import Delimiter from "@editorjs/delimiter";
import Marker from "@editorjs/marker";
import InlineCode from "@editorjs/inline-code";
import Underline from "@editorjs/underline";
import type { API, BlockTune } from "@editorjs/editorjs";


type EmbedConstructor = new (...args: never[]) => object;

type EmbedService = {
  regex?: RegExp;
};

type EmbedCtorWithServices = {
  services?: Record<string, EmbedService>;
};

type EmbedPasteEvent = {
  detail: {
    key: string;
    data: string;
  };
};

type EmbedInstanceInternals = {
  element: HTMLElement | null;
  onPaste: (event: EmbedPasteEvent) => void;
  data: {
    service?: string;
  };
};

type EmbedSizeData = {
  width?: number;
  height?: number;
};

class EmbedSizeTune implements BlockTune {
  private api: API;
  private data: EmbedSizeData;
  private wrapper: HTMLElement | null = null;
  private widthInput: HTMLInputElement | null = null;
  private heightInput: HTMLInputElement | null = null;

  static get isTune() {
    return true;
  }

  private applyLiveSize() {
    const currentIndex = this.api.blocks.getCurrentBlockIndex();

    if (currentIndex < 0) {
      return;
    }

    const block = this.api.blocks.getBlockByIndex(currentIndex);
    const holder = block?.holder;

    if (!holder) {
      return;
    }

    const iframe = holder.querySelector("iframe") as HTMLIFrameElement | null;
    const embedContent = holder.querySelector(".embed-tool__content") as HTMLElement | null;

    if (!iframe) {
      return;
    }

    const width = Number(this.widthInput?.value ?? this.data.width ?? 100);
    const height = Number(this.heightInput?.value ?? this.data.height ?? 420);

    iframe.style.setProperty("display", "block", "important");
    iframe.style.setProperty("width", `${width}%`, "important");
    iframe.style.setProperty("max-width", "100%", "important");
    iframe.style.setProperty("height", `${height}px`, "important");
    iframe.style.marginLeft = "auto";
    iframe.style.marginRight = "auto";
    iframe.style.border = "0";
    iframe.setAttribute("height", String(height));

    if (embedContent) {
      embedContent.style.setProperty("width", `${width}%`, "important");
      embedContent.style.setProperty("max-width", "100%", "important");
      embedContent.style.setProperty("height", `${height}px`, "important");
      embedContent.style.marginLeft = "auto";
      embedContent.style.marginRight = "auto";
    }

    this.data = {
      ...this.data,
      width,
      height,
    };
  }

  constructor({ api, data }: { api: API; data: EmbedSizeData }) {
    this.api = api;
    this.data = data ?? {};
  }

  render() {
    this.wrapper = document.createElement("div");
    this.wrapper.className = "flex flex-col gap-3 p-3 text-sm";

    const widthLabel = document.createElement("label");
    widthLabel.className = "flex flex-col gap-1";
    widthLabel.textContent = "Width (%)";

    this.widthInput = document.createElement("input");
    this.widthInput.type = "range";
    this.widthInput.min = "40";
    this.widthInput.max = "100";
    this.widthInput.step = "1";
    this.widthInput.value = String(this.data.width ?? 100);

    const widthValue = document.createElement("span");
    widthValue.textContent = `${this.widthInput.value}%`;

    this.widthInput.addEventListener("input", () => {
      widthValue.textContent = `${this.widthInput?.value ?? "100"}%`;
      this.applyLiveSize();
    });

    widthLabel.append(this.widthInput, widthValue);

    const heightLabel = document.createElement("label");
    heightLabel.className = "flex flex-col gap-1";
    heightLabel.textContent = "Height (px)";

    this.heightInput = document.createElement("input");
    this.heightInput.type = "range";
    this.heightInput.min = "280";
    this.heightInput.max = "1800";
    this.heightInput.step = "20";
    this.heightInput.value = String(this.data.height ?? 420);

    const heightValue = document.createElement("span");
    heightValue.textContent = `${this.heightInput.value}px`;

    this.heightInput.addEventListener("input", () => {
      heightValue.textContent = `${this.heightInput?.value ?? "420"}px`;
      this.applyLiveSize();
    });

    heightLabel.append(this.heightInput, heightValue);

    this.wrapper.append(widthLabel, heightLabel);

    return this.wrapper;
  }

  save() {
    const width = Number(this.widthInput?.value ?? this.data.width ?? 100);
    const height = Number(this.heightInput?.value ?? this.data.height ?? 420);

    return {
      width,
      height,
    };
  }

  wrap(blockContent: HTMLElement) {
    const iframe = blockContent.querySelector("iframe");
    const embedContent = blockContent.querySelector(".embed-tool__content") as HTMLElement | null;
    const embedContainer = blockContent.querySelector(".embed-tool") as HTMLElement | null;

    if (!iframe) {
      return blockContent;
    }

    const width = Number(this.data.width ?? 100);
    const height = Number(this.data.height ?? 420);

    const applyEmbedSize = (nextWidth: number, nextHeight: number) => {
      iframe.style.display = "block";
      iframe.style.setProperty("width", `${nextWidth}%`, "important");
      iframe.style.setProperty("max-width", "100%", "important");
      iframe.style.setProperty("height", `${nextHeight}px`, "important");
      iframe.style.marginLeft = "auto";
      iframe.style.marginRight = "auto";
      iframe.style.border = "0";
      iframe.setAttribute("height", String(nextHeight));

      if (embedContent) {
        embedContent.style.setProperty("width", `${nextWidth}%`, "important");
        embedContent.style.setProperty("max-width", "100%", "important");
        embedContent.style.setProperty("height", `${nextHeight}px`, "important");
        embedContent.style.marginLeft = "auto";
        embedContent.style.marginRight = "auto";
      }

      if (embedContainer) {
        embedContainer.style.setProperty("overflow", "visible", "important");
      }
    };

    applyEmbedSize(width, height);

    if (!blockContent.querySelector('[data-embed-size-controls="true"]')) {
      const controls = document.createElement("div");
      controls.className = "flex flex-wrap items-center gap-2 mb-2 text-xs";
      controls.setAttribute("data-embed-size-controls", "true");

      const widthLabel = document.createElement("label");
      widthLabel.className = "flex items-center gap-2";
      widthLabel.textContent = "Width";

      const widthRange = document.createElement("input");
      widthRange.type = "range";
      widthRange.min = "40";
      widthRange.max = "100";
      widthRange.step = "1";
      widthRange.value = String(width);

      const widthValue = document.createElement("span");
      widthValue.textContent = `${width}%`;

      widthLabel.append(widthRange, widthValue);

      const heightLabel = document.createElement("label");
      heightLabel.className = "flex items-center gap-2";
      heightLabel.textContent = "Height";

      const heightRange = document.createElement("input");
      heightRange.type = "range";
      heightRange.min = "280";
      heightRange.max = "1800";
      heightRange.step = "20";
      heightRange.value = String(height);

      const heightValue = document.createElement("span");
      heightValue.textContent = `${height}px`;

      heightLabel.append(heightRange, heightValue);

      const sync = () => {
        const nextWidth = Number(widthRange.value);
        const nextHeight = Number(heightRange.value);

        widthValue.textContent = `${nextWidth}%`;
        heightValue.textContent = `${nextHeight}px`;

        this.data = {
          ...this.data,
          width: nextWidth,
          height: nextHeight,
        };

        this.widthInput = widthRange;
        this.heightInput = heightRange;

        applyEmbedSize(nextWidth, nextHeight);
      };

      widthRange.addEventListener("input", sync);
      heightRange.addEventListener("input", sync);

      controls.append(widthLabel, heightLabel);
      blockContent.insertBefore(controls, blockContent.firstChild);

      this.widthInput = widthRange;
      this.heightInput = heightRange;
    }

    return blockContent;
  }
}

export const createEditorTools = async () => {
  const embedModule = await import("@editorjs/embed");
  const embedExport =
    (embedModule as { default?: unknown }).default ?? embedModule;
  const embedValue =
    (embedExport as { default?: unknown }).default ?? embedExport;
  const EmbedTool = embedValue as EmbedConstructor;
  const embedRender = (embedValue as { prototype?: { render?: unknown } }).prototype
    ?.render;

  class EmbedWithToolbox extends EmbedTool {
    static get toolbox() {
      return {
        title: "Embed",
        icon: '<svg width="18" height="18" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M8.59 16.59 4 12l4.59-4.59L10 8.82 6.83 12 10 15.18zM15.41 16.59 14 15.18 17.17 12 14 8.82l1.41-1.41L20 12z"/></svg>',
      };
    }

    render() {
      const self = this as unknown as EmbedInstanceInternals;

      if (self.data?.service) {
        if (typeof embedRender === "function") {
          const rendered = Reflect.apply(embedRender, this, []) as HTMLElement;

          return rendered;
        }

        return document.createElement("div");
      }

      const container = document.createElement("div");
      container.className = "border border-border rounded-md p-3 flex gap-2 items-center";

      const input = document.createElement("input");
      input.type = "url";
      input.placeholder = "Paste URL (YouTube, Instagram, Pinterest...)";
      input.className = "flex-1 min-w-0 bg-transparent outline-none text-sm";

      const button = document.createElement("button");
      button.type = "button";
      button.textContent = "Embed";
      button.className = "px-3 py-1 rounded border border-border text-sm transition-colors cursor-pointer hover:bg-neutral-100";

      const submit = () => {
        const url = input.value.trim();

        if (!url) {
          return;
        }

        const services =
          (this.constructor as unknown as EmbedCtorWithServices).services ?? {};

        const matched = Object.entries(services).find(([, service]) => {
          if (!service.regex) {
            return false;
          }

          service.regex.lastIndex = 0;
          return service.regex.test(url);
        });

        if (!matched) {
          input.setCustomValidity("Unsupported URL for current Embed services");
          input.reportValidity();
          return;
        }

        input.setCustomValidity("");
        self.onPaste({
          detail: {
            key: matched[0],
            data: url,
          },
        });
      };

      button.addEventListener("click", () => {
        void submit();
      });
      input.addEventListener("keydown", (event) => {
        if (event.key === "Enter" && !event.isComposing) {
          event.preventDefault();
          button.click();
        }
      });

      container.append(input, button);
      self.element = container;

      return container;
    }
  }

  return {
    header: {
      class: Header,
      inlineToolbar: true,
      config: {
        levels: [1, 2, 3, 4],
        defaultLevel: 2,
      },
    },

    list: {
      class: List,
      inlineToolbar: true,
    },

    quote: {
      class: Quote,
      inlineToolbar: true,
    },

    embed: {
      class: EmbedWithToolbox,
      tunes: ["embedSize"],
      config: {
        services: {
          youtube: true,
          coub: true,
          facebook: true,
          instagram: true,
          pinterest: true,
        },
      },
    },

    embedSize: {
      class: EmbedSizeTune,
    },

    delimiter: {
      class: Delimiter,
    },

    marker: {
      class: Marker,
    },

    inlineCode: {
      class: InlineCode,
    },

    underline: {
      class: Underline,
    },
  };
};