# 🌍 World Explorer

A dynamic, API-driven country discovery web application built with Vanilla JavaScript and Tailwind CSS.

## Features
- **Browse & Pagination**: Loads 20 countries at a time with a "Load Next 20" button (configurable up to 250).
- **Search, Filter & Sort**: Debounced search by country name, filter by region, and sort by area, name, or population.
- **Country Detail Modal**: Click any country card to view currencies, languages, Google Maps link, and clickable border country chips.
- **Favorites & Compare**: Save favorite countries in `localStorage` and compare any 2 side by side.
- **Dark / Light Mode**: Theme toggle persisted in `localStorage`.
- **UI States**: Distinct loading, error (with Retry), and empty states.

## API Used
- [Countries.dev API](https://countries.dev/)

## Live Demo
- [Live Vercel App](https://worldexplorerproject.vercel.app)
