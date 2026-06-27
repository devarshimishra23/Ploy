import express from "express";
import path from "path";
import dotenv from "dotenv";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";

dotenv.config();

const app = express();
app.use(express.json());

const PORT = 3000;

// Lazy initialization of Gemini client
let aiClient: GoogleGenAI | null = null;

function getAiClient(): GoogleGenAI {
  if (!aiClient) {
    const key = process.env.GEMINI_API_KEY;
    if (!key) {
      throw new Error("GEMINI_API_KEY environment variable is required");
    }
    aiClient = new GoogleGenAI({
      apiKey: key,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
  return aiClient;
}

// Pre-packaged high-quality fallback presets when API key is missing or for rapid first-loads
const FALLBACK_PRESETS: Record<string, any> = {
  maharashtra_snacks: {
    demographicProfile: {
      tier1: {
        avgIncome: "₹85,000 / mo",
        digitalChannels: "Instagram, YouTube, Swiggy/Zomato",
        languages: "English, Hindi, Marathi",
        purchasingPowerIndex: 92,
        digitalLiteracy: 95,
        trustDrivers: "Premium packaging, Organic certified, Quick Commerce speed",
        volumePercent: 15,
      },
      tier2: {
        avgIncome: "₹45,000 / mo",
        digitalChannels: "WhatsApp, YouTube, Instagram",
        languages: "Marathi, Hindi, English",
        purchasingPowerIndex: 65,
        digitalLiteracy: 80,
        trustDrivers: "Value for money, Endorsements from regional creators, Clean labels",
        volumePercent: 35,
      },
      tier3: {
        avgIncome: "₹22,000 / mo",
        digitalChannels: "WhatsApp, YouTube, ShareChat",
        languages: "Marathi, Vernacular dialects",
        purchasingPowerIndex: 35,
        digitalLiteracy: 55,
        trustDrivers: "Cash on delivery, Transparent regional pricing, Multi-pack savings",
        volumePercent: 50,
      }
    },
    gtmBlueprint: {
      localizationChecklist: [
        { task: "Support Marathi & Hindi in billing & customer service", priority: "High", desc: "MSME clients & tier 3 consumers feel most secure with vernacular support." },
        { task: "Establish 100% UPI checkout and prominent COD option", priority: "High", desc: "COD reduces cart abandonment by up to 45% in semi-urban areas." },
        { task: "Optimize single-serve sachets (Chhota Packs) for pricing", priority: "High", desc: "Low unit-price packs (₹5 to ₹10) are the golden entry point in Tier 3 Maharashtra." },
        { task: "Deploy Whatsapp-based ordering bot", priority: "Medium", desc: "Eliminate app download friction by using standard chat workflows." }
      ],
      distributionRoadmap: {
        logisticsGuidelines: "For perishable or semi-perishable snacks, utilize hyper-local distributors in Tier-2 hubs like Nashik, Nagpur, and Aurangabad instead of centralizing in Pune or Mumbai.",
        infrastructureChallenges: "Frequent power cuts in Tier 3 cold chain supply. Stick to stable ambient-shelf-life packaging.",
        deliveryPartners: "Shiprocket, Delhivery (excellent pin-code coverage), and local state transport (MSRTC) parcels for B2B cargo.",
        digitalOutreachChannels: "WhatsApp broadcast lists, ShareChat localized micro-video ads, and collaboration with regional Marathi cooking YouTube channels."
      }
    },
    marketInsights: {
      regionalHeatmaps: [
        { name: "Pune - Pimpri Chinchwad", pinCode: "411018", demandIntensity: 88, competitorDensity: 82, purchasingPowerIndex: 85 },
        { name: "Nashik Suburban Hub", pinCode: "422009", demandIntensity: 76, competitorDensity: 55, purchasingPowerIndex: 68 },
        { name: "Kolhapur District Center", pinCode: "416003", demandIntensity: 82, competitorDensity: 42, purchasingPowerIndex: 72 },
        { name: "Aurangabad (Chhatrapati Sambhajinagar)", pinCode: "431001", demandIntensity: 71, competitorDensity: 38, purchasingPowerIndex: 59 },
        { name: "Solapur Rural Fringe", pinCode: "413002", demandIntensity: 64, competitorDensity: 21, purchasingPowerIndex: 48 },
        { name: "Nagpur Wardha Belt", pinCode: "440010", demandIntensity: 78, competitorDensity: 50, purchasingPowerIndex: 65 }
      ],
      cacLtvPredictor: [
        { channel: "Vernacular Meta Video Ads", cacMin: 80, cacMax: 140, ltvMin: 450, ltvMax: 700, efficiency: 82 },
        { channel: "WhatsApp Direct Marketing", cacMin: 30, cacMax: 60, ltvMin: 280, ltvMax: 400, efficiency: 88 },
        { channel: "Local Grocer B2B Partnership", cacMin: 180, cacMax: 300, ltvMin: 1200, ltvMax: 2500, efficiency: 75 }
      ],
      vernacularSentiment: [
        { language: "Marathi", sentiment: "Positive", sentimentScore: 78, sampleSlogan: "घरची चव, शुद्ध आणि स्वस्त!", translation: "Taste of home, pure and affordable!" },
        { language: "Hindi (Regional)", sentiment: "Neutral", sentimentScore: 62, sampleSlogan: "शुद्ध सामग्री, आपकी बचत!", translation: "Pure ingredients, your savings!" }
      ]
    }
  },
  gujarat_apparel: {
    demographicProfile: {
      tier1: {
        avgIncome: "₹90,000 / mo",
        digitalChannels: "Myntra, Instagram, Ajio Luxe",
        languages: "Gujarati, English, Hindi",
        purchasingPowerIndex: 94,
        digitalLiteracy: 96,
        trustDrivers: "Modern aesthetic, Sustainability certifications, Easy returns",
        volumePercent: 12,
      },
      tier2: {
        avgIncome: "₹50,000 / mo",
        digitalChannels: "Instagram, Ajio, WhatsApp",
        languages: "Gujarati, Hindi",
        purchasingPowerIndex: 72,
        digitalLiteracy: 84,
        trustDrivers: "Premium fabrics, Festive promotions, Return policy clarity",
        volumePercent: 38,
      },
      tier3: {
        avgIncome: "₹24,000 / mo",
        digitalChannels: "WhatsApp, YouTube, Facebook",
        languages: "Gujarati, Local dialects",
        purchasingPowerIndex: 40,
        digitalLiteracy: 60,
        trustDrivers: "COD verification, Community-approved reviews, Durability claims",
        volumePercent: 50,
      }
    },
    gtmBlueprint: {
      localizationChecklist: [
        { task: "Design creatives themed around Gujarati festivals (Navratri, Uttarayan)", priority: "High", desc: "Regional affinity skyrockets during massive local celebrations." },
        { task: "Enable high-trust Cash on Delivery checkout flows", priority: "High", desc: "Over 60% of Tier-3 Gujarat consumers prefer physically verifying parcel before paying." },
        { task: "Support Gujarati vernacular customer outreach on WhatsApp", priority: "Medium", desc: "Simplifies conversation and speeds up returns query handling." }
      ],
      distributionRoadmap: {
        logisticsGuidelines: "Leverage Ahmedabad & Surat hubs as central garment storage nodes. Establish fast surface shipping channels to Tier-2 cities like Rajkot and Jamnagar.",
        infrastructureChallenges: "Congested local markets in Tier-3 locations makes last-mile delivery tricky for larger logistics vans. Prefer bike-rider partnerships.",
        deliveryPartners: "Surat local cargo networks, BlueDart, Delhivery, and Xpressbees.",
        digitalOutreachChannels: "Collaborative Reels with regional Gujarati lifestyle influencers, festive WhatsApp catalogs, and geo-targeted Facebook ads."
      }
    },
    marketInsights: {
      regionalHeatmaps: [
        { name: "Ahmedabad West", pinCode: "380015", demandIntensity: 92, competitorDensity: 88, purchasingPowerIndex: 90 },
        { name: "Surat Textile Hub", pinCode: "395003", demandIntensity: 89, competitorDensity: 90, purchasingPowerIndex: 84 },
        { name: "Rajkot Urban Area", pinCode: "360001", demandIntensity: 81, competitorDensity: 60, purchasingPowerIndex: 74 },
        { name: "Vadodara City Center", pinCode: "390001", demandIntensity: 84, competitorDensity: 65, purchasingPowerIndex: 78 },
        { name: "Anand District Belt", pinCode: "388001", demandIntensity: 75, competitorDensity: 40, purchasingPowerIndex: 68 },
        { name: "Bhuj Kutch Rural Hub", pinCode: "370001", demandIntensity: 63, competitorDensity: 28, purchasingPowerIndex: 52 }
      ],
      cacLtvPredictor: [
        { channel: "Instagram Influencer Gifting", cacMin: 120, cacMax: 200, ltvMin: 900, ltvMax: 1500, efficiency: 80 },
        { channel: "Facebook Localized Festive Ads", cacMin: 70, cacMax: 110, ltvMin: 500, ltvMax: 850, efficiency: 85 },
        { channel: "Direct Resellers WhatsApp Groups", cacMin: 40, cacMax: 80, ltvMin: 400, ltvMax: 700, efficiency: 90 }
      ],
      vernacularSentiment: [
        { language: "Gujarati", sentiment: "Positive", sentimentScore: 84, sampleSlogan: "શ્રેષ્ઠ ગુણવत्ता, વ્યાજબી ભાવ!", translation: "Best quality, reasonable price!" },
        { language: "Hindi (Regional)", sentiment: "Neutral", sentimentScore: 68, sampleSlogan: "सूरत का कपड़ा, सबसे बढ़िया!", translation: "Fabric of Surat, the absolute best!" }
      ]
    }
  }
};

// Main API generation route using Gemini API
app.post("/api/gtm/generate", async (req, res) => {
  const { industry, pricePoint, goal, selectedState, selectedTier } = req.body;

  if (!industry || !pricePoint || !goal || !selectedState) {
    return res.status(400).json({ error: "Missing required fields: industry, pricePoint, goal, selectedState" });
  }

  // Create a cache/preset key for basic demo combinations when API Key is missing or user requests presets
  const presetKey = `${selectedState.toLowerCase()}_${industry.toLowerCase()}`;
  
  // Try to use Gemini API if key is available, else gracefully fallback to presets or dynamically computed mock responses
  try {
    const hasKey = !!process.env.GEMINI_API_KEY;
    if (!hasKey) {
      console.log("No GEMINI_API_KEY found, returning highly realistic dynamically customized fallback response.");
      // Return custom structured data based on input
      const matchedPreset = FALLBACK_PRESETS[presetKey] || FALLBACK_PRESETS["maharashtra_snacks"];
      const customizedResponse = customizeFallback(matchedPreset, industry, pricePoint, goal, selectedState, selectedTier);
      return res.json({ ...customizedResponse, isFallback: true });
    }

    const ai = getAiClient();
    const prompt = `
      You are PLOY GTM, an expert Go-To-Market advisory intelligence system tailored for Indian MSMEs and early-stage startups.
      
      Generate a comprehensive, highly localized, data-driven GTM Strategy and regional market analytics report for the following business profile:
      - **Industry**: ${industry}
      - **Product Price Point**: ₹${pricePoint}
      - **Primary Goal**: ${goal}
      - **Target State**: ${selectedState}
      - **Specific Tier Focus**: ${selectedTier || "All Tiers"}
      
      Please return strict JSON matching exactly the requested schema. Provide realistic regional names, real districts/cities of the selected state, realistic PIN codes, valid languages, correct digital channels, and actual marketing slogans in the state's main languages (along with English translations).
    `;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        systemInstruction: `You are an expert Indian GTM Consultant. Your job is to output highly detailed, realistic, and localization-focused data matrices for Indian states. Your response must be strict JSON containing:
        {
          "demographicProfile": {
            "tier1": { "avgIncome": string, "digitalChannels": string, "languages": string, "purchasingPowerIndex": number, "digitalLiteracy": number, "trustDrivers": string, "volumePercent": number },
            "tier2": { "avgIncome": string, "digitalChannels": string, "languages": string, "purchasingPowerIndex": number, "digitalLiteracy": number, "trustDrivers": string, "volumePercent": number },
            "tier3": { "avgIncome": string, "digitalChannels": string, "languages": string, "purchasingPowerIndex": number, "digitalLiteracy": number, "trustDrivers": string, "volumePercent": number }
          },
          "gtmBlueprint": {
            "localizationChecklist": [
              { "task": string, "priority": "High" | "Medium" | "Low", "desc": string }
            ],
            "distributionRoadmap": {
              "logisticsGuidelines": string,
              "infrastructureChallenges": string,
              "deliveryPartners": string,
              "digitalOutreachChannels": string
            }
          },
          "marketInsights": {
            "regionalHeatmaps": [
              { "name": string, "pinCode": string, "demandIntensity": number, "competitorDensity": number, "purchasingPowerIndex": number }
            ],
            "cacLtvPredictor": [
              { "channel": string, "cacMin": number, "cacMax": number, "ltvMin": number, "ltvMax": number, "efficiency": number }
            ],
            "vernacularSentiment": [
              { "language": string, "sentiment": "Positive" | "Negative" | "Neutral", "sentimentScore": number, "sampleSlogan": string, "translation": string }
            ]
          }
        }
        
        Ensure regionalHeatmaps has exactly 5 to 6 actual districts or neighborhoods in the selected state of ${selectedState}, each with a correct 6-digit PIN code. Ensure that vernacularSentiment generates 2 taglines: one in the dominant language of ${selectedState} (e.g. Marathi for Maharashtra, Gujarati for Gujarat, Tamil for Tamil Nadu, Kannada for Karnataka, Bengali for West Bengal, Telugu for Telangana/AP, Hindi for UP/Delhi, etc.) and one in Hindi or English, reflecting the exact pricing and product goals. All scores must be between 1 and 100. Income brackets must be realistic in Indian Rupees (₹).`,
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            demographicProfile: {
              type: Type.OBJECT,
              properties: {
                tier1: {
                  type: Type.OBJECT,
                  properties: {
                    avgIncome: { type: Type.STRING },
                    digitalChannels: { type: Type.STRING },
                    languages: { type: Type.STRING },
                    purchasingPowerIndex: { type: Type.INTEGER },
                    digitalLiteracy: { type: Type.INTEGER },
                    trustDrivers: { type: Type.STRING },
                    volumePercent: { type: Type.INTEGER }
                  },
                  required: ["avgIncome", "digitalChannels", "languages", "purchasingPowerIndex", "digitalLiteracy", "trustDrivers", "volumePercent"]
                },
                tier2: {
                  type: Type.OBJECT,
                  properties: {
                    avgIncome: { type: Type.STRING },
                    digitalChannels: { type: Type.STRING },
                    languages: { type: Type.STRING },
                    purchasingPowerIndex: { type: Type.INTEGER },
                    digitalLiteracy: { type: Type.INTEGER },
                    trustDrivers: { type: Type.STRING },
                    volumePercent: { type: Type.INTEGER }
                  },
                  required: ["avgIncome", "digitalChannels", "languages", "purchasingPowerIndex", "digitalLiteracy", "trustDrivers", "volumePercent"]
                },
                tier3: {
                  type: Type.OBJECT,
                  properties: {
                    avgIncome: { type: Type.STRING },
                    digitalChannels: { type: Type.STRING },
                    languages: { type: Type.STRING },
                    purchasingPowerIndex: { type: Type.INTEGER },
                    digitalLiteracy: { type: Type.INTEGER },
                    trustDrivers: { type: Type.STRING },
                    volumePercent: { type: Type.INTEGER }
                  },
                  required: ["avgIncome", "digitalChannels", "languages", "purchasingPowerIndex", "digitalLiteracy", "trustDrivers", "volumePercent"]
                }
              },
              required: ["tier1", "tier2", "tier3"]
            },
            gtmBlueprint: {
              type: Type.OBJECT,
              properties: {
                localizationChecklist: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      task: { type: Type.STRING },
                      priority: { type: Type.STRING },
                      desc: { type: Type.STRING }
                    },
                    required: ["task", "priority", "desc"]
                  }
                },
                distributionRoadmap: {
                  type: Type.OBJECT,
                  properties: {
                    logisticsGuidelines: { type: Type.STRING },
                    infrastructureChallenges: { type: Type.STRING },
                    deliveryPartners: { type: Type.STRING },
                    digitalOutreachChannels: { type: Type.STRING }
                  },
                  required: ["logisticsGuidelines", "infrastructureChallenges", "deliveryPartners", "digitalOutreachChannels"]
                }
              },
              required: ["localizationChecklist", "distributionRoadmap"]
            },
            marketInsights: {
              type: Type.OBJECT,
              properties: {
                regionalHeatmaps: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      name: { type: Type.STRING },
                      pinCode: { type: Type.STRING },
                      demandIntensity: { type: Type.INTEGER },
                      competitorDensity: { type: Type.INTEGER },
                      purchasingPowerIndex: { type: Type.INTEGER }
                    },
                    required: ["name", "pinCode", "demandIntensity", "competitorDensity", "purchasingPowerIndex"]
                  }
                },
                cacLtvPredictor: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      channel: { type: Type.STRING },
                      cacMin: { type: Type.INTEGER },
                      cacMax: { type: Type.INTEGER },
                      ltvMin: { type: Type.INTEGER },
                      ltvMax: { type: Type.INTEGER },
                      efficiency: { type: Type.INTEGER }
                    },
                    required: ["channel", "cacMin", "cacMax", "ltvMin", "ltvMax", "efficiency"]
                  }
                },
                vernacularSentiment: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      language: { type: Type.STRING },
                      sentiment: { type: Type.STRING },
                      sentimentScore: { type: Type.INTEGER },
                      sampleSlogan: { type: Type.STRING },
                      translation: { type: Type.STRING }
                    },
                    required: ["language", "sentiment", "sentimentScore", "sampleSlogan", "translation"]
                  }
                }
              },
              required: ["regionalHeatmaps", "cacLtvPredictor", "vernacularSentiment"]
            }
          },
          required: ["demographicProfile", "gtmBlueprint", "marketInsights"]
        }
      }
    });

    const text = response.text;
    if (!text) {
      throw new Error("Empty response from Gemini API");
    }

    const parsed = JSON.parse(text);
    return res.json({ ...parsed, isFallback: false });
  } catch (error: any) {
    console.error("Gemini Generation Error:", error.message || error);
    // Graceful error recovery: customize a beautiful preset and return it
    const matchedPreset = FALLBACK_PRESETS[presetKey] || FALLBACK_PRESETS["maharashtra_snacks"];
    const customizedResponse = customizeFallback(matchedPreset, industry, pricePoint, goal, selectedState, selectedTier);
    return res.json({
      ...customizedResponse,
      isFallback: true,
      notice: "An error occurred or GEMINI_API_KEY was inactive. PLOY GTM resolved this gracefully with localized simulated calculations."
    });
  }
});

// Helper function to customize fallback templates to make them dynamically fit the user inputs
function customizeFallback(preset: any, industry: string, pricePoint: number, goal: string, state: string, tier: string) {
  // Deep copy
  const cloned = JSON.parse(JSON.stringify(preset));
  
  // Adjust based on state name
  const stateLanguages: Record<string, string[]> = {
    Maharashtra: ["Marathi", "Hindi", "English"],
    Gujarat: ["Gujarati", "Hindi", "English"],
    Karnataka: ["Kannada", "English", "Hindi"],
    "Tamil Nadu": ["Tamil", "English"],
    "Uttar Pradesh": ["Hindi", "Urdu", "English"],
    Delhi: ["Hindi", "English", "Punjabi"],
    "West Bengal": ["Bengali", "English", "Hindi"],
    Telangana: ["Telugu", "Urdu", "English"],
    "Andhra Pradesh": ["Telugu", "English"]
  };
  
  const langs = stateLanguages[state] || ["Hindi", "English", "Vernacular"];
  
  cloned.demographicProfile.tier1.languages = langs.join(", ");
  cloned.demographicProfile.tier2.languages = langs.slice(0, 2).join(", ");
  cloned.demographicProfile.tier3.languages = `${langs[0]}, local dialects`;

  // Dynamically adapt checklist for specific industries
  if (industry.toLowerCase().includes("fintech") || industry.toLowerCase().includes("loan") || industry.toLowerCase().includes("pay")) {
    cloned.gtmBlueprint.localizationChecklist = [
      { task: "Comply with strict RBI localized security guidelines", priority: "High", desc: "Security badges and regional certifications build user confidence instantly." },
      { task: "Provide video-KYC instructions in vernacular audio", priority: "High", desc: "Non-English readers drop off during paper verification processes." },
      { task: "Enable offline SMS fallback alerts", priority: "Medium", desc: "Crucial for Tier 3 operators with fluctuating 4G/5G data connections." },
      { task: "Support offline agent/merchant-assisted on-boarding", priority: "High", desc: "Physical handholding is key to scaling financial trust in rural belts." }
    ];
  } else if (industry.toLowerCase().includes("agri") || industry.toLowerCase().includes("farm") || industry.toLowerCase().includes("crop")) {
    cloned.gtmBlueprint.localizationChecklist = [
      { task: "Deploy voice-guided advisory modules (IVR & WhatsApp Voice)", priority: "High", desc: "Over 70% of farmers prefer listening or sending voice notes over text inputs." },
      { task: "Partner with local Gram Panchayat nodes and PACS", priority: "High", desc: "Leverage existing high-trust physical community centers." },
      { task: "Calibrate pricing around seasonal harvesting credit cycles", priority: "High", desc: "Farmers experience high liquidity only post-harvest (Rabi & Kharif)." }
    ];
  } else if (industry.toLowerCase().includes("d2c") || industry.toLowerCase().includes("fmcg") || industry.toLowerCase().includes("food")) {
    cloned.gtmBlueprint.localizationChecklist = [
      { task: "Launch trial sizes or low ticket sample bundles", priority: "High", desc: "MSME customers will not risk large sums on unproven digital brands." },
      { task: "Prominent 'Cash on Delivery' messaging across advertising banners", priority: "High", desc: "Reassures cautious buyers that their money is safe." },
      { task: "Partner with local mom-and-pop stores (Kiranas) for hyper-local pickup", priority: "Medium", desc: "Saves high delivery costs and builds local validation." }
    ];
  }

  // Adjust prices and numbers based on product input
  const formattedPrice = `₹${pricePoint}`;
  cloned.gtmBlueprint.localizationChecklist.push({
    task: `Calibrate pricing around standard mass thresholds for product price of ${formattedPrice}`,
    priority: "High",
    desc: `Ensure flexible localized EMIs or smaller packaging sizes to fit this price bracket.`
  });

  // Customize regional heatmaps with state districts
  const stateDistricts: Record<string, Array<{name: string, pin: string}>> = {
    Maharashtra: [
      { name: "Pune Center", pin: "411001" },
      { name: "Nagpur Wardha", pin: "440001" },
      { name: "Nashik Suburban", pin: "422001" },
      { name: "Kolhapur Commercial", pin: "416001" },
      { name: "Aurangabad Industrial", pin: "431001" }
    ],
    Gujarat: [
      { name: "Ahmedabad West", pin: "380001" },
      { name: "Surat Textile Belt", pin: "395001" },
      { name: "Rajkot GIDC", pin: "360001" },
      { name: "Vadodara Suburb", pin: "390001" },
      { name: "Anand Dairy Hub", pin: "388001" }
    ],
    Karnataka: [
      { name: "Bengaluru South", pin: "560001" },
      { name: "Mysuru Heritage Hub", pin: "570001" },
      { name: "Hubli Industrial", pin: "580001" },
      { name: "Belagavi Northern Belt", pin: "590001" },
      { name: "Mangaluru Coastal Center", pin: "575001" }
    ],
    "Tamil Nadu": [
      { name: "Chennai T-Nagar", pin: "600017" },
      { name: "Coimbatore Textile Hub", pin: "641001" },
      { name: "Madurai Temple Area", pin: "625001" },
      { name: "Tiruchirappalli Belt", pin: "620001" },
      { name: "Salem Industrial", pin: "636001" }
    ],
    "Uttar Pradesh": [
      { name: "Noida Sector 62", pin: "201301" },
      { name: "Lucknow Hazratganj", pin: "226001" },
      { name: "Kanpur Leather Hub", pin: "208001" },
      { name: "Varanasi Heritage", pin: "221001" },
      { name: "Agra Tourism Belt", pin: "282001" }
    ],
    "West Bengal": [
      { name: "Kolkata Salt Lake", pin: "700091" },
      { name: "Howrah Industrial", pin: "711101" },
      { name: "Durgapur Steel Belt", pin: "713201" },
      { name: "Siliguri North Gateway", pin: "734001" },
      { name: "Asansol Industrial Center", pin: "713301" }
    ]
  };

  const districts = stateDistricts[state] || [
    { name: `${state} Urban Center`, pin: "110001" },
    { name: `${state} Mid-Tier Hub`, pin: "110052" },
    { name: `${state} Rural Core`, pin: "110085" }
  ];

  cloned.marketInsights.regionalHeatmaps = districts.map((d, index) => {
    // Generate slight variations
    const seed = index + 1;
    return {
      name: d.name,
      pinCode: d.pin,
      demandIntensity: Math.min(95, Math.max(30, 85 - seed * 6)),
      competitorDensity: Math.min(90, Math.max(10, 78 - seed * 12)),
      purchasingPowerIndex: Math.min(98, Math.max(25, 90 - seed * 9))
    };
  });

  // Adjust CAC and LTV based on price point
  cloned.marketInsights.cacLtvPredictor = cloned.marketInsights.cacLtvPredictor.map((predictor: any) => {
    const factor = pricePoint > 1000 ? (pricePoint / 300) : 1;
    return {
      ...predictor,
      cacMin: Math.round(predictor.cacMin * (pricePoint > 2000 ? 1.8 : 1)),
      cacMax: Math.round(predictor.cacMax * (pricePoint > 2000 ? 2.0 : 1.1)),
      ltvMin: Math.round(predictor.ltvMin * factor),
      ltvMax: Math.round(predictor.ltvMax * factor)
    };
  });

  // Slogan localized tags
  const slogans: Record<string, Record<string, {slogan: string, trans: string}>> = {
    Maharashtra: {
      Marathi: { slogan: "किंमत कमी, फायदा जास्त! महाराष्ट्राची नवी पसंती.", trans: "Low price, high benefit! Maharashtra's new preference." }
    },
    Gujarat: {
      Gujarati: { slogan: "ઓછા બજેટમાં ડબલ ધમાકો! સાચો વ્યાપાર.", trans: "Double blast in low budget! True business value." }
    },
    Karnataka: {
      Kannada: { slogan: "ಕಡಿಮೆ ವೆಚ್ಚ, ಅದ್ಭುತ ಗುಣಮಟ್ಟ! ನಮ್ಮ ಹೆಮ್ಮೆ.", trans: "Low cost, wonderful quality! Our pride." }
    },
    "Tamil Nadu": {
      Tamil: { slogan: "குறைந்த விலை, நிறைந்த தரம்! தமிழகத்தின் தேர்வு.", trans: "Low price, full quality! Tamil Nadu's choice." }
    },
    "Uttar Pradesh": {
      Hindi: { slogan: "बचत भी, क्वालिटी भी! हर घर की पसंद.", trans: "Savings too, quality too! Every home's favorite." }
    }
  };

  const primaryLang = langs[0];
  const stateSlogans = slogans[state] || slogans["Uttar Pradesh"];
  const selectedSlogan = stateSlogans[primaryLang] || {
    slogan: `शानदार ${industry} प्रोडक्ट, केवल ${formattedPrice} में!`,
    trans: `Premium ${industry} product, for only ${formattedPrice}!`
  };

  cloned.marketInsights.vernacularSentiment = [
    {
      language: primaryLang,
      sentiment: "Positive",
      sentimentScore: 82,
      sampleSlogan: selectedSlogan.slogan,
      translation: selectedSlogan.trans
    },
    {
      language: "Hindi",
      sentiment: "Positive",
      sentimentScore: 76,
      sampleSlogan: `विश्वसनीय और किफायती ${industry}!`,
      translation: `Trustworthy and affordable ${industry}!`
    }
  ];

  return cloned;
}

// Serve Vite client app
if (process.env.NODE_ENV !== "production") {
  createViteServer({
    server: { middlewareMode: true },
    appType: "spa",
  }).then((vite) => {
    app.use(vite.middlewares);
    
    // Fallback all other requests to index.html for Vite SPA routing
    app.get("*", (req, res, next) => {
      // Don't intercept API routes
      if (req.path.startsWith("/api/")) {
        return next();
      }
      res.sendFile(path.join(process.cwd(), "index.html"));
    });

    app.listen(PORT, "0.0.0.0", () => {
      console.log(`[Dev] Server running on http://localhost:${PORT}`);
    });
  });
} else {
  const distPath = path.join(process.cwd(), "dist");
  app.use(express.static(distPath));
  
  app.get("*", (req, res, next) => {
    if (req.path.startsWith("/api/")) {
      return next();
    }
    res.sendFile(path.join(distPath, "index.html"));
  });

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[Production] Server running on port ${PORT}`);
  });
}
