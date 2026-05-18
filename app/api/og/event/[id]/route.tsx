import { ImageResponse } from "next/og"
import { createClient }  from "@/lib/supabase/server"

export const runtime = "nodejs"

const W = 1200
const H = 630

const TEAL       = "#0d9488"
const TEAL_DARK  = "#0f766e"
const WHITE      = "#ffffff"
const WHITE_80   = "rgba(255,255,255,0.80)"
const WHITE_20   = "rgba(255,255,255,0.20)"

const TYPE_LABEL: Record<string, string> = {
  night_out:     "Night out",
  lunch:         "Lunch",
  coffee:        "Coffee",
  team_building: "Team building",
  activity:      "Activity",
  other:         "Event",
}

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-GB", {
    weekday: "long", day: "numeric", month: "long", year: "numeric",
  })
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params

  const supabase = await createClient(true)
  const { data: event } = await supabase
    .from("events")
    .select("title, description, type, date, alcohol_friendly")
    .eq("id", id)
    .single()

  const title       = event?.title            ?? "An event on Doo's"
  const typeLabel   = TYPE_LABEL[event?.type ?? "other"] ?? "Event"
  const dateLine    = event?.date ? fmtDate(event.date) : null
  const alcohol     = event?.alcohol_friendly ?? false

  // Truncate long titles for the card
  const displayTitle = title.length > 60 ? title.slice(0, 57) + "…" : title

  return new ImageResponse(
    (
      <div
        style={{
          width:           "100%",
          height:          "100%",
          display:         "flex",
          flexDirection:   "column",
          backgroundColor: TEAL_DARK,
          padding:         "64px 72px",
          fontFamily:      "sans-serif",
          position:        "relative",
        }}
      >
        {/* Decorative teal circle — top-right */}
        <div
          style={{
            position:        "absolute",
            top:             -160,
            right:           -160,
            width:           480,
            height:          480,
            borderRadius:    "50%",
            backgroundColor: WHITE_20,
            display:         "flex",
          }}
        />

        {/* Top bar — wordmark + type badge */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          {/* Doo's wordmark */}
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div
              style={{
                width:           48,
                height:          48,
                borderRadius:    12,
                backgroundColor: WHITE_20,
                display:         "flex",
                alignItems:      "center",
                justifyContent:  "center",
                fontSize:        28,
                fontWeight:      900,
                color:           WHITE,
              }}
            >
              D
            </div>
            <div style={{ fontSize: 32, fontWeight: 800, color: WHITE, letterSpacing: "-0.5px" }}>
              Doo&apos;s
            </div>
          </div>

          {/* Type badge */}
          <div
            style={{
              backgroundColor: WHITE_20,
              borderRadius:    9999,
              padding:         "10px 24px",
              fontSize:        22,
              fontWeight:      600,
              color:           WHITE,
              display:         "flex",
            }}
          >
            {typeLabel}
          </div>
        </div>

        {/* Title — vertically centred */}
        <div
          style={{
            flex:       1,
            display:    "flex",
            alignItems: "center",
          }}
        >
          <div
            style={{
              fontSize:      displayTitle.length > 40 ? 68 : 80,
              fontWeight:    800,
              color:         WHITE,
              lineHeight:    1.1,
              letterSpacing: "-1.5px",
              maxWidth:      900,
            }}
          >
            {displayTitle}
          </div>
        </div>

        {/* Bottom bar — date + alcohol indicator */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {dateLine && (
              <div style={{ fontSize: 26, color: WHITE_80, fontWeight: 500 }}>
                {dateLine}
              </div>
            )}
            <div style={{ fontSize: 20, color: WHITE_20, fontWeight: 400 }}>
              doos.app
            </div>
          </div>

          {alcohol && (
            <div
              style={{
                backgroundColor: WHITE_20,
                borderRadius:    9999,
                padding:         "8px 20px",
                fontSize:        20,
                fontWeight:      600,
                color:           WHITE,
                display:         "flex",
                gap:             8,
                alignItems:      "center",
              }}
            >
              🍸 Alcohol-friendly
            </div>
          )}
        </div>
      </div>
    ),
    { width: W, height: H },
  )
}
