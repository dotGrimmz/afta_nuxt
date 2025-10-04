import { computed, nextTick, ref, watch } from "vue";

export type PricingPreset = {
  id: string;
  name: string;
  baseCardCost: number;
  freeSpaceCost: number;
  autoMarkCost: number;
  payout?: number;
  payoutPercentage?: number;
  metadata?: {
    source?: "builtin" | "custom";
    createdAt?: string;
  };
};

export type PricingPresetDraft = {
  name: string;
  baseCardCost: number;
  freeSpaceCost: number;
  autoMarkCost: number;
  payout?: number;
  payoutPercentage?: number;
};

const PRICING_PRESETS_STORAGE_KEY = "dashboard_bingo_custom_presets";
const PRICING_PRESET_SELECTION_KEY = "dashboard_bingo_selected_preset";
const PRICING_BASE_VALUES_KEY = "dashboard_bingo_pricing_values";
const CUSTOM_PRESET_SELECTION_SENTINEL = "__custom__";

const isBrowser = typeof window !== "undefined";

const clampCurrency = (value: number) =>
  Math.round(Math.max(value, 0) * 10) / 10;

const createPresetSlug = (raw: string) =>
  raw
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

const builtinPresets: PricingPreset[] = [
  {
    id: "rose",
    name: "Rose Bingo",
    baseCardCost: 80,
    freeSpaceCost: 0,
    autoMarkCost: 0,
    payoutPercentage: 0.5,
    metadata: { source: "builtin" },
  },
  {
    id: "standard",
    name: "Standard",
    baseCardCost: 400,
    freeSpaceCost: 100,
    autoMarkCost: 0,
    payout: 1000,
    metadata: { source: "builtin" },
  },
  {
    id: "premium",
    name: "Premium",
    baseCardCost: 500,
    freeSpaceCost: 125,
    autoMarkCost: 50,
    payout: 1500,
    metadata: { source: "builtin" },
  },
  {
    id: "highRoller",
    name: "High Roller",
    baseCardCost: 600,
    freeSpaceCost: 150,
    autoMarkCost: 100,
    payout: 2000,
    metadata: { source: "builtin" },
  },
];

const formatPercentageLabel = (value: number) => {
  const raw = (value * 100).toFixed(1);
  return raw.endsWith(".0") ? raw.slice(0, -2) : raw;
};

const ensureUniquePresetId = (name: string, taken: Set<string>) => {
  const base = createPresetSlug(name) || "preset";
  let candidate = base;
  let suffix = 1;
  while (taken.has(candidate)) {
    candidate = `${base}-${suffix++}`;
  }
  taken.add(candidate);
  return candidate;
};

const loadCustomPricingPresets = (existing: PricingPreset[]) => {
  if (!isBrowser) return [] as PricingPreset[];
  try {
    const raw = window.localStorage.getItem(PRICING_PRESETS_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];

    const taken = new Set(existing.map((preset) => preset.id));
    const restored: PricingPreset[] = [];

    for (const entry of parsed) {
      if (!entry || typeof entry !== "object") continue;
      const obj = entry as Record<string, any>;
      const name =
        typeof obj.name === "string" && obj.name.trim()
          ? obj.name.trim()
          : "Custom Preset";
      let id =
        typeof obj.id === "string" && obj.id.trim()
          ? obj.id.trim()
          : createPresetSlug(name) || "preset";
      if (taken.has(id)) {
        id = ensureUniquePresetId(name, taken);
      } else {
        taken.add(id);
      }

      const base = Number(obj.baseCardCost);
      const free = Number(obj.freeSpaceCost);
      const auto = Number(obj.autoMarkCost);
      if (![base, free, auto].every((n) => Number.isFinite(n))) continue;

      const payoutRaw = Number(obj.payout);
      const payoutPercentageRaw = Number(obj.payoutPercentage);

      restored.push({
        id,
        name,
        baseCardCost: clampCurrency(base),
        freeSpaceCost: clampCurrency(free),
        autoMarkCost: clampCurrency(auto),
        payout:
          Number.isFinite(payoutRaw) && payoutRaw >= 0
            ? clampCurrency(payoutRaw)
            : undefined,
        payoutPercentage:
          Number.isFinite(payoutPercentageRaw) && payoutPercentageRaw >= 0
            ? Math.min(Math.max(payoutPercentageRaw, 0), 1)
            : undefined,
        metadata: {
          source: "custom",
          createdAt:
            typeof (obj as any).metadata?.createdAt === "string"
              ? (obj as any).metadata.createdAt
              : new Date().toISOString(),
        },
      });
    }

    return restored;
  } catch (err) {
    console.warn("Unable to restore custom pricing presets", err);
    return [];
  }
};

const loadBasePricingValues = () => {
  if (!isBrowser) return null;
  try {
    const raw = window.localStorage.getItem(PRICING_BASE_VALUES_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Record<string, any>;
    const base = Number(parsed.baseCardCost);
    const free = Number(parsed.freeSpaceCost);
    const auto = Number(parsed.autoMarkCost);
    if (![base, free, auto].every((n) => Number.isFinite(n))) return null;
    return {
      baseCardCost: clampCurrency(base),
      freeSpaceCost: clampCurrency(free),
      autoMarkCost: clampCurrency(auto),
    };
  } catch (err) {
    console.warn("Unable to restore base pricing values", err);
    return null;
  }
};

export const roundPayoutToNearestTen = (total: number, percent: number) => {
  const roundedTotal = Math.round(total * 10) / 10;
  return Math.min(
    roundedTotal,
    Math.max(0, Math.round((roundedTotal * percent) / 10) * 10)
  );
};

export const useBingoPricingPresets = () => {
  const pricingPresets = ref<PricingPreset[]>([...builtinPresets]);
  const isHydrating = ref(true);

  const findPresetById = (id: string | null | undefined) =>
    pricingPresets.value.find((preset) => preset.id === id);

  const customPresets = loadCustomPricingPresets(pricingPresets.value);
  if (customPresets.length) {
    pricingPresets.value = [...pricingPresets.value, ...customPresets];
  }

  const savedSelectionRaw = isBrowser
    ? window.localStorage.getItem(PRICING_PRESET_SELECTION_KEY)
    : null;
  const savedSelectionWasCustom =
    savedSelectionRaw === CUSTOM_PRESET_SELECTION_SENTINEL;
  const savedSelectedPresetId =
    !savedSelectionWasCustom && savedSelectionRaw ? savedSelectionRaw : null;

  const storedBaseValues = loadBasePricingValues();

  const fallbackPreset =
    findPresetById("rose") ?? pricingPresets.value[0] ?? null;

  let initialSelectedPreset = savedSelectedPresetId
    ? (findPresetById(savedSelectedPresetId) ?? null)
    : null;

  if (!initialSelectedPreset && !savedSelectionWasCustom) {
    initialSelectedPreset = fallbackPreset;
  }

  const baseCardCost = ref(
    savedSelectionWasCustom
      ? (storedBaseValues?.baseCardCost ?? fallbackPreset?.baseCardCost ?? 400)
      : (initialSelectedPreset?.baseCardCost ??
          fallbackPreset?.baseCardCost ??
          400)
  );

  const freeSpaceCost = ref(
    savedSelectionWasCustom
      ? (storedBaseValues?.freeSpaceCost ??
          fallbackPreset?.freeSpaceCost ??
          100)
      : (initialSelectedPreset?.freeSpaceCost ??
          fallbackPreset?.freeSpaceCost ??
          100)
  );

  const autoMarkCost = ref(
    savedSelectionWasCustom
      ? (storedBaseValues?.autoMarkCost ?? fallbackPreset?.autoMarkCost ?? 0)
      : (initialSelectedPreset?.autoMarkCost ??
          fallbackPreset?.autoMarkCost ??
          0)
  );

  const selectedPricingPresetId = ref<string | undefined>(
    savedSelectionWasCustom
      ? undefined
      : initialSelectedPreset?.id ?? fallbackPreset?.id ?? undefined
  );

  const formatPresetLabel = (preset: PricingPreset) => {
    const details: string[] = [`${preset.baseCardCost} base`];
    if (preset.freeSpaceCost) {
      details.push(`${preset.freeSpaceCost} free`);
    }
    if (preset.autoMarkCost) {
      details.push(`${preset.autoMarkCost} auto`);
    }
    const payoutLabel =
      typeof preset.payoutPercentage === "number"
        ? `${formatPercentageLabel(preset.payoutPercentage)}% pot`
        : `💎${preset.payout ?? 0}`;
    return `${preset.name} · ${details.join(" / ")} (${payoutLabel})`;
  };

  const pricingPresetItems = computed(() =>
    pricingPresets.value.map((preset) => ({
      label: formatPresetLabel(preset),
      value: preset.id,
    }))
  );

  const selectedPricingPreset = computed(() =>
    findPresetById(selectedPricingPresetId.value)
  );

  const persistCustomPricingPresets = () => {
    if (!isBrowser || isHydrating.value) return;
    const custom = pricingPresets.value.filter(
      (preset) => preset.metadata?.source === "custom"
    );
    if (!custom.length) {
      window.localStorage.removeItem(PRICING_PRESETS_STORAGE_KEY);
      return;
    }
    window.localStorage.setItem(
      PRICING_PRESETS_STORAGE_KEY,
      JSON.stringify(custom)
    );
  };

  const persistBasePricingValues = () => {
    if (!isBrowser || isHydrating.value) return;
    const payload = {
      baseCardCost: baseCardCost.value,
      freeSpaceCost: freeSpaceCost.value,
      autoMarkCost: autoMarkCost.value,
    };
    window.localStorage.setItem(
      PRICING_BASE_VALUES_KEY,
      JSON.stringify(payload)
    );
  };

  const persistSelectedPricingPresetId = (id: string | undefined) => {
    if (!isBrowser || isHydrating.value) return;
    if (!id) {
      window.localStorage.setItem(
        PRICING_PRESET_SELECTION_KEY,
        CUSTOM_PRESET_SELECTION_SENTINEL
      );
    } else {
      window.localStorage.setItem(PRICING_PRESET_SELECTION_KEY, id);
    }
  };

  watch(pricingPresets, () => persistCustomPricingPresets(), {
    deep: true,
  });
  watch([baseCardCost, freeSpaceCost, autoMarkCost], () => {
    persistBasePricingValues();
  });
  watch(selectedPricingPresetId, (id) => {
    persistSelectedPricingPresetId(id);
  });

  if (isBrowser) {
    nextTick(() => {
      isHydrating.value = false;
    });
  } else {
    isHydrating.value = false;
  }

  const createPreset = (draft: PricingPresetDraft): PricingPreset => {
    const name = draft.name.trim() || "Custom Preset";
    const taken = new Set(pricingPresets.value.map((preset) => preset.id));
    const id = ensureUniquePresetId(name, taken);

    const payload: PricingPreset = {
      id,
      name,
      baseCardCost: clampCurrency(draft.baseCardCost),
      freeSpaceCost: clampCurrency(draft.freeSpaceCost),
      autoMarkCost: clampCurrency(draft.autoMarkCost),
      metadata: {
        source: "custom",
        createdAt: new Date().toISOString(),
      },
    };

    if (typeof draft.payoutPercentage === "number") {
      payload.payoutPercentage = Math.min(
        Math.max(draft.payoutPercentage, 0),
        1
      );
    } else if (typeof draft.payout === "number") {
      payload.payout = clampCurrency(draft.payout);
    }

    pricingPresets.value = [...pricingPresets.value, payload];
    selectedPricingPresetId.value = payload.id;
    return payload;
  };

  const removePreset = (id: string) => {
    const preset = findPresetById(id);
    if (!preset || preset.metadata?.source === "builtin") return;

    pricingPresets.value = pricingPresets.value.filter(
      (item) => item.id !== id
    );

    if (selectedPricingPresetId.value === id) {
      const fallback =
        findPresetById("rose") ?? pricingPresets.value[0] ?? null;
      selectedPricingPresetId.value = fallback?.id ?? undefined;
    }
  };

  return {
    pricingPresets,
    pricingPresetItems,
    selectedPricingPresetId,
    selectedPricingPreset,
    baseCardCost,
    freeSpaceCost,
    autoMarkCost,
    createPreset,
    removePreset,
    findPresetById,
    formatPresetLabel,
    roundPayoutToNearestTen,
  };
};
