import { defineConfig } from "astro/config";
import starlight from "@astrojs/starlight";

export default defineConfig({
  site: "https://iracedeck.com",
  integrations: [
    starlight({
      title: "iRaceDeck",
      logo: {
        src: "./src/assets/iracedeck-logo-full-white.png",
        replacesTitle: true,
      },
      customCss: ["./src/styles/custom.css"],
      social: [
        {
          icon: "github",
          label: "GitHub",
          href: "https://github.com/niklam/iracedeck",
        },
        {
          icon: "discord",
          label: "Discord",
          href: "https://discord.gg/c6nRYywpah",
        },
      ],
      favicon: "/favicon.svg",
      head: [
        {
          tag: "script",
          attrs: {
            async: true,
            src: "https://www.googletagmanager.com/gtag/js?id=G-HKB3F7KB00",
          },
        },
        {
          tag: "script",
          content:
            "window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments)}gtag('js',new Date());gtag('config','G-HKB3F7KB00');",
        },
        {
          tag: "link",
          attrs: {
            rel: "icon",
            type: "image/x-icon",
            href: "/favicon.ico",
          },
        },
        {
          tag: "link",
          attrs: {
            rel: "icon",
            type: "image/png",
            sizes: "96x96",
            href: "/favicon-96x96.png",
          },
        },
        {
          tag: "link",
          attrs: {
            rel: "apple-touch-icon",
            sizes: "180x180",
            href: "/apple-touch-icon.png",
          },
        },
        {
          tag: "link",
          attrs: { rel: "manifest", href: "/site.webmanifest" },
        },
      ],
      sidebar: [
        {
          label: "Getting Started",
          items: [
            { slug: "getting-started/installation" },
            { slug: "getting-started/troubleshooting" },
          ],
        },
        {
          label: "Actions",
          items: [
            { slug: "actions/overview" },
            {
              label: "Display & Session",
              items: [
                { slug: "actions/display-session/session-info" },
                { slug: "actions/display-session/telemetry-display" },
              ],
            },
            {
              label: "Driving Controls",
              items: [
                { slug: "actions/driving/ai-spotter-controls" },
                { slug: "actions/driving/audio-controls" },
                { slug: "actions/driving/black-box-selector" },
                { slug: "actions/driving/look-direction" },
                { slug: "actions/driving/car-control" },
              ],
            },
            {
              label: "Cockpit & Interface",
              items: [
                { slug: "actions/cockpit/cockpit-misc" },
                { slug: "actions/cockpit/splits-delta-cycle" },
                { slug: "actions/cockpit/telemetry-control" },
                { slug: "actions/cockpit/toggle-ui-elements" },
              ],
            },
            {
              label: "View & Camera",
              items: [
                { slug: "actions/view-camera/view-adjustment" },
                { slug: "actions/view-camera/replay-control" },
                { slug: "actions/view-camera/camera-cycle" },
                { slug: "actions/view-camera/camera-focus" },
                { slug: "actions/view-camera/camera-editor-controls" },
                { slug: "actions/view-camera/camera-editor-adjustments" },
              ],
            },
            {
              label: "Media",
              items: [{ slug: "actions/media/media-capture" }],
            },
            {
              label: "Pit Service",
              items: [
                { slug: "actions/pit-service/pit-quick-actions" },
                { slug: "actions/pit-service/fuel-service" },
                { slug: "actions/pit-service/tire-service" },
              ],
            },
            {
              label: "Car Setup",
              items: [
                { slug: "actions/car-setup/setup-aero" },
                { slug: "actions/car-setup/setup-brakes" },
                { slug: "actions/car-setup/setup-chassis" },
                { slug: "actions/car-setup/setup-engine" },
                { slug: "actions/car-setup/setup-fuel" },
                { slug: "actions/car-setup/setup-hybrid" },
                { slug: "actions/car-setup/setup-traction" },
              ],
            },
            {
              label: "Communication",
              items: [{ slug: "actions/communication/chat" }],
            },
          ],
        },
        {
          label: "Reference",
          items: [
            { slug: "reference/action-types" },
            { slug: "reference/template-variables" },
            { slug: "reference/keyboard-shortcuts" },
          ],
        },
        {
          label: "Links",
          items: [
            {
              label: "Elgato Marketplace",
              link: "https://marketplace.elgato.com/product/iracedeck-042a0efb-58aa-428c-b1de-8b6169edd21d",
              attrs: { target: "_blank" },
            },
            {
              label: "GitHub",
              link: "https://github.com/niklam/iracedeck",
              attrs: { target: "_blank" },
            },
            {
              label: "Discord",
              link: "https://discord.gg/c6nRYywpah",
              attrs: { target: "_blank" },
            },
          ],
        },
      ],
    }),
  ],
});
