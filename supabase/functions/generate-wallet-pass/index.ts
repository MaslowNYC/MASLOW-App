import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const PASS_TYPE_ID = "pass.nyc.maslow";
const TEAM_ID = "KA74TN36V2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function formatTierDisplay(tier: string | null): string {
  if (!tier) return "Member";
  const t = tier.toLowerCase();
  if (t === "founding") return "Founding Member";
  if (t === "architect") return "Architect";
  if (t === "sovereign") return "Sovereign";
  return "Member";
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    // Accept token from Authorization header OR query parameter
    const authHeader = req.headers.get("Authorization") ||
      (() => {
        const url = new URL(req.url);
        const token = url.searchParams.get("token");
        return token ? `Bearer ${token}` : null;
      })();
    if (!authHeader) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const { data: profile } = await supabase
      .from("profiles")
      .select("first_name, last_name, member_number, membership_tier")
      .eq("id", user.id)
      .single();

    const memberNumber = profile?.member_number
      ? `#${String(profile.member_number).padStart(5, "0")}`
      : "#00001";
    const memberName = `${profile?.first_name || ""} ${profile?.last_name || ""}`.trim() || "Member";
    const tierDisplay = formatTierDisplay(profile?.membership_tier);

    // Get certs from environment
    const signerCert = Deno.env.get("APPLE_PASS_CERT_PEM")!;
    const signerKey = Deno.env.get("APPLE_PASS_KEY_PEM")!;
    const wwdr = Deno.env.get("APPLE_WWDR_CERT_PEM")!;

    console.log('Certs loaded:', {
      hasCert: !!signerCert,
      hasKey: !!signerKey,
      hasWwdr: !!wwdr,
      certLength: signerCert?.length,
      keyLength: signerKey?.length,
    });

    // Dynamically import passkit-generator
    const { PKPass } = await import("https://esm.sh/passkit-generator@3");

    const pass = new PKPass({}, {
      signerCert,
      signerKey,
      wwdr,
    }, {
      description: "Maslow Membership",
      formatVersion: 1,
      organizationName: "Maslow",
      passTypeIdentifier: PASS_TYPE_ID,
      serialNumber: `maslow-${user.id.substring(0, 8)}-${Date.now()}`,
      teamIdentifier: TEAM_ID,
      foregroundColor: "rgb(245, 240, 230)",
      backgroundColor: "rgb(27, 58, 107)",
      labelColor: "rgb(196, 159, 88)",
      logoText: "MASLOW",
    });

    pass.type = "generic";

    pass.primaryFields.push({
      key: "member",
      label: "MEMBER",
      value: memberName,
    });

    pass.secondaryFields.push(
      { key: "tier", label: "TIER", value: tierDisplay },
      { key: "number", label: "NUMBER", value: memberNumber }
    );

    pass.backFields.push(
      { key: "terms", label: "Terms", value: "This pass grants access to Maslow. Present at entry. Non-transferable." },
      { key: "contact", label: "Contact", value: "hello@maslow.nyc" },
      { key: "website", label: "Website", value: "https://maslow.nyc" }
    );

    pass.setBarcodes({
      format: "PKBarcodeFormatQR",
      message: user.id,
      messageEncoding: "iso-8859-1",
    });

    const buffer = await pass.getAsBuffer();

    return new Response(buffer, {
      status: 200,
      headers: {
        ...corsHeaders,
        "Content-Type": "application/vnd.apple.pkpass",
        "Content-Disposition": `attachment; filename="maslow-pass.pkpass"`,
      },
    });

  } catch (error) {
    console.error("Pass generation error:", JSON.stringify({
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      name: error instanceof Error ? error.name : undefined,
    }));
    return new Response(JSON.stringify({
      error: "Failed to generate pass",
      details: error instanceof Error ? error.message : String(error)
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
