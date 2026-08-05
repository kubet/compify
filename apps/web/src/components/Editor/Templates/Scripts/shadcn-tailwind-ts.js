export default function tailwindShadcnTsScript() {
  return {
    '/tailwind.config.ts': {
      code: `export default {
    darkMode: ["class"],
    theme: {
        container: {
            center: true,
            padding: "2rem",
            screens: {
                "2xl": "1400px",
            },
        },
        extend: {
            colors: {
                border: "hsl(var(--border))",
                input: "hsl(var(--input))",
                ring: "hsl(var(--ring))",
                background: "hsl(var(--background))",
                foreground: "hsl(var(--foreground))",
                primary: {
                    DEFAULT: "hsl(var(--primary))",
                    foreground: "hsl(var(--primary-foreground))",
                },
                secondary: {
                    DEFAULT: "hsl(var(--secondary))",
                    foreground: "hsl(var(--secondary-foreground))",
                },
                destructive: {
                    DEFAULT: "hsl(var(--destructive))",
                    foreground: "hsl(var(--destructive-foreground))",
                },
                muted: {
                    DEFAULT: "hsl(var(--muted))",
                    foreground: "hsl(var(--muted-foreground))",
                },
                accent: {
                    DEFAULT: "hsl(var(--accent))",
                    foreground: "hsl(var(--accent-foreground))",
                },
                popover: {
                    DEFAULT: "hsl(var(--popover))",
                    foreground: "hsl(var(--popover-foreground))",
                },
                card: {
                    DEFAULT: "hsl(var(--card))",
                    foreground: "hsl(var(--card-foreground))",
                },
                sidebar: {
                    DEFAULT: "hsl(var(--sidebar-background))",
                    foreground: "hsl(var(--sidebar-foreground))",
                    primary: "hsl(var(--sidebar-primary))",
                    "primary-foreground": "hsl(var(--sidebar-primary-foreground))",
                    accent: "hsl(var(--sidebar-accent))",
                    "accent-foreground": "hsl(var(--sidebar-accent-foreground))",
                    border: "hsl(var(--sidebar-border))",
                    ring: "hsl(var(--sidebar-ring))",
                },
            },
            borderRadius: {
                xl: "calc(var(--radius) + 4px)",
                lg: "var(--radius)",
                md: "calc(var(--radius) - 2px)",
                sm: "calc(var(--radius) - 4px)",
            },
            keyframes: {
                "accordion-down": {
                    from: { height: 0 },
                    to: { height: "var(--radix-accordion-content-height)" },
                },
                "accordion-up": {
                    from: { height: "var(--radix-accordion-content-height)" },
                    to: { height: 0 },
                },
                "caret-blink": {
                    "0%,70%,100%": { opacity: "1" },
                    "20%,50%": { opacity: "0" },
                },
            },
            animation: {
                "accordion-down": "accordion-down 0.2s ease-out",
                "accordion-up": "accordion-up 0.2s ease-out",
                "caret-blink": "caret-blink 1.25s ease-out infinite",
            }
        }
    },
    plugins: [require("tailwindcss-animate")],
}`,
    },
    '/globals.css': {
      code: `@tailwind base;
@tailwind components;
@tailwind utilities;


@layer base {
    :root {
      --background: 0 0% 100%;
      --foreground: 20 14.3% 4.1%;
      --card: 0 0% 100%;
      --card-foreground: 20 14.3% 4.1%;
      --popover: 0 0% 100%;
      --popover-foreground: 20 14.3% 4.1%;
      --primary: 47.9 95.8% 53.1%;
      --primary-foreground: 26 83.3% 14.1%;
      --secondary: 60 4.8% 95.9%;
      --secondary-foreground: 24 9.8% 10%;
      --muted: 60 4.8% 95.9%;
      --muted-foreground: 25 5.3% 44.7%;
      --accent: 60 4.8% 95.9%;
      --accent-foreground: 24 9.8% 10%;
      --destructive: 0 84.2% 60.2%;
      --destructive-foreground: 60 9.1% 97.8%;
      --border: 20 5.9% 90%;
      --input: 20 5.9% 90%;
      --ring: 20 14.3% 4.1%;
      --radius: 0.75rem;
      --chart-1: 12 76% 61%;
      --chart-2: 173 58% 39%;
      --chart-3: 197 37% 24%;
      --chart-4: 43 74% 66%;
      --chart-5: 27 87% 67%;
    }
  
    .dark {
      --background: 20 14.3% 4.1%;
      --foreground: 60 9.1% 97.8%;
      --card: 20 14.3% 4.1%;
      --card-foreground: 60 9.1% 97.8%;
      --popover: 20 14.3% 4.1%;
      --popover-foreground: 60 9.1% 97.8%;
      --primary: 47.9 95.8% 53.1%;
      --primary-foreground: 26 83.3% 14.1%;
      --secondary: 12 6.5% 15.1%;
      --secondary-foreground: 60 9.1% 97.8%;
      --muted: 12 6.5% 15.1%;
      --muted-foreground: 24 5.4% 63.9%;
      --accent: 12 6.5% 15.1%;
      --accent-foreground: 60 9.1% 97.8%;
      --destructive: 0 62.8% 30.6%;
      --destructive-foreground: 60 9.1% 97.8%;
      --border: 12 6.5% 15.1%;
      --input: 12 6.5% 15.1%;
      --ring: 35.5 91.7% 32.9%;
      --chart-1: 220 70% 50%;
      --chart-2: 160 60% 45%;
      --chart-3: 30 80% 55%;
      --chart-4: 280 65% 60%;
      --chart-5: 340 75% 55%;
    }
  }
  

@layer base {
  * {
    @apply border-border;
  }
  body {
    @apply bg-background text-foreground;
    font-feature-settings: "rlig" 1, "calt" 1;
  }
}`
    },
    "tailwindcss-animate.ts": {
      "code": "export default function({addUtilities,matchUtilities,theme}){addUtilities({\"@keyframes enter\":theme(\"keyframes.enter\"),\"@keyframes exit\":theme(\"keyframes.exit\"),\".animate-in\":{animationName:\"enter\",animationDuration:theme(\"animationDuration.DEFAULT\"),\"--tw-enter-opacity\":\"initial\",\"--tw-enter-scale\":\"initial\",\"--tw-enter-rotate\":\"initial\",\"--tw-enter-translate-x\":\"initial\",\"--tw-enter-translate-y\":\"initial\"},\".animate-out\":{animationName:\"exit\",animationDuration:theme(\"animationDuration.DEFAULT\"),\"--tw-exit-opacity\":\"initial\",\"--tw-exit-scale\":\"initial\",\"--tw-exit-rotate\":\"initial\",\"--tw-exit-translate-x\":\"initial\",\"--tw-exit-translate-y\":\"initial\"},\".running\":{animationPlayState:\"running\"},\".paused\":{animationPlayState:\"paused\"}});const utilities={fade:{in:\"opacity\",out:\"opacity\"},zoom:{in:\"scale\",out:\"scale\"},spin:{in:\"rotate\",out:\"rotate\"}};Object.entries(utilities).forEach(([name,{in:inProp,out:outProp}])=>{matchUtilities({[`${name}-in`]:(value)=>({[`--tw-enter-${inProp}`]:value}),[`${name}-out`]:(value)=>({[`--tw-exit-${outProp}`]:value})},{values:theme(`animation${inProp.charAt(0).toUpperCase()+inProp.slice(1)}`)})});const slides={\"slide-in-from\":\"--tw-enter\",\"slide-out-to\":\"--tw-exit\"};Object.entries(slides).forEach(([name,prefix])=>{matchUtilities({[`${name}-top`]:(v)=>({[`${prefix}-translate-y`]:`-${v}`}),[`${name}-bottom`]:(v)=>({[`${prefix}-translate-y`]:v}),[`${name}-left`]:(v)=>({[`${prefix}-translate-x`]:`-${v}`}),[`${name}-right`]:(v)=>({[`${prefix}-translate-x`]:v})},{values:theme(\"animationTranslate\")})});[\"duration\",\"delay\",\"ease\",\"fill-mode\",\"direction\",\"repeat\"].forEach(prop=>{matchUtilities({[prop]:(v)=>({[`animation${prop.charAt(0).toUpperCase()+prop.slice(1)}`]:v})},{values:theme(`animation${prop.charAt(0).toUpperCase()+prop.slice(1)}`)})});return{theme:{extend:{animationDelay:({theme})=>theme(\"transitionDelay\"),animationDuration:({theme})=>({0:\"0ms\",...theme(\"transitionDuration\")}),animationTimingFunction:({theme})=>theme(\"transitionTimingFunction\"),animationFillMode:{none:\"none\",forwards:\"forwards\",backwards:\"backwards\",both:\"both\"},animationDirection:{normal:\"normal\",reverse:\"reverse\",alternate:\"alternate\",\"alternate-reverse\":\"alternate-reverse\"},animationOpacity:({theme})=>({DEFAULT:0,...theme(\"opacity\")}),animationTranslate:({theme})=>({DEFAULT:\"100%\",...theme(\"translate\")}),animationScale:({theme})=>({DEFAULT:0,...theme(\"scale\")}),animationRotate:({theme})=>({DEFAULT:\"30deg\",...theme(\"rotate\")}),animationRepeat:{0:\"0\",1:\"1\",infinite:\"infinite\"},keyframes:{enter:{from:{opacity:\"var(--tw-enter-opacity, 1)\",transform:\"translate3d(var(--tw-enter-translate-x, 0), var(--tw-enter-translate-y, 0), 0) scale3d(var(--tw-enter-scale, 1), var(--tw-enter-scale, 1), var(--tw-enter-scale, 1)) rotate(var(--tw-enter-rotate, 0))\"}},exit:{to:{opacity:\"var(--tw-exit-opacity, 1)\",transform:\"translate3d(var(--tw-exit-translate-x, 0), var(--tw-exit-translate-y, 0), 0) scale3d(var(--tw-exit-scale, 1), var(--tw-exit-scale, 1), var(--tw-exit-scale, 1)) rotate(var(--tw-exit-rotate, 0))\"}}}}}}};module.exports=exports.default",
      "hidden": true
    },
  }
}