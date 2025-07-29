import { Routes, Route } from "react-router-dom";
import { Suspense, lazy } from "react";
import { Layout } from "./layout/Layout";
import { Toaster } from "./components/ui/toaster";
import { ErrorBoundary } from "./components/ErrorBoundary";

const Dashboard = lazy(() => import("./pages/Dashboard").then(module => ({ default: module.Dashboard })));
const Portfolio = lazy(() => import("./pages/Portfolio").then(module => ({ default: module.Portfolio })));
const Appeals = lazy(() => import("./pages/Appeals").then(module => ({ default: module.Appeals })));
const Filing = lazy(() => import("./pages/Filing").then(module => ({ default: module.Filing })));
const Reports = lazy(() => import("./pages/Reports").then(module => ({ default: module.Reports })));
const Settings = lazy(() => import("./pages/Settings").then(module => ({ default: module.Settings })));

export function App() {
  return (
    <>
      <ErrorBoundary>
        <Layout>
          <Suspense fallback={<div className="flex items-center justify-center h-64 text-zinc-600">Loading...</div>}>
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/portfolio" element={<Portfolio />} />
              <Route path="/appeals" element={<Appeals />} />
              <Route path="/filing" element={<Filing />} />
              <Route path="/reports" element={<Reports />} />
              <Route path="/settings" element={<Settings />} />
            </Routes>
          </Suspense>
        </Layout>
      </ErrorBoundary>
      <Toaster />
    </>
  );
}

export default App
