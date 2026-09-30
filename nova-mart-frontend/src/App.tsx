import { Routes, Route } from 'react-router-dom';
import { AuthProvider } from './store/AuthContext';
import { ThemeProvider } from './store/ThemeContext';
import ProtectedRoute from './components/ProtectedRoute';
import MainLayout from './layouts/MainLayout';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import PosPage from './pages/PosPage';
import SalesHistoryPage from './pages/SalesHistoryPage';
import ProductsPage from './pages/ProductsPage';
import CategoriesPage from './pages/CategoriesPage';
import BrandsPage from './pages/BrandsPage';
import PromotionsPage from './pages/PromotionsPage';
import CustomersPage from './pages/CustomersPage';
import SuppliersPage from './pages/SuppliersPage';
import PurchaseOrdersPage from './pages/PurchaseOrdersPage';
import ReportsPage from './pages/ReportsPage';

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <MainLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<DashboardPage />} />
            <Route path="pos" element={<PosPage />} />
            <Route path="sales-history" element={<SalesHistoryPage />} />
            <Route path="products" element={<ProductsPage />} />
            <Route path="categories" element={<CategoriesPage />} />
            <Route path="brands" element={<BrandsPage />} />
            <Route path="promotions" element={<PromotionsPage />} />
            <Route path="customers" element={<CustomersPage />} />
            <Route
              path="suppliers"
              element={
                <ProtectedRoute roles={['Administrator', 'Manager']}>
                  <SuppliersPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="purchase-orders"
              element={
                <ProtectedRoute roles={['Administrator', 'Manager']}>
                  <PurchaseOrdersPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="reports"
              element={
                <ProtectedRoute roles={['Administrator', 'Manager']}>
                  <ReportsPage />
                </ProtectedRoute>
              }
            />
          </Route>
        </Routes>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;