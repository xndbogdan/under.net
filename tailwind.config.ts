import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        'gray-mac': '#dddddd',
        'blue-ukraine': '#0057b7',
        'yellow-ukraine': '#ffdd00',
      },
    },
    fontFamily: {
      'chicago': ["Chicago" ],
      'sans': ["Helvetica", "Arial"],
    },
  },
  plugins: [],
};
export default config;
