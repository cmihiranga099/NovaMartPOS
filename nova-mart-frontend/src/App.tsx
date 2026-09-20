import { Routes, Route } from 'react-router-dom';
import { AuthProvider } from './store/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import MainLayout from './layouts/MainLayout';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import ProductsPage from './pages/ProductsPage';
import CustomersPage from './pages/CustomersPage';
import PosPage from './pages/PosPage';
import CategoriesPage from './pages/CategoriesPage';
import BrandsPage from './pages/BrandsPage';
import PromotionsPage from './pages/PromotionsPage';
import SalesHistoryPage from './pages/SalesHistoryPage';
import SuppliersPage from './pages/SuppliersPage';
import PurchaseOrdersPage from './pages/PurchaseOrdersPage';
import ReportsPage from './pages/ReportsPage';


function App() {
  return (
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
          <Route path="products" element={<ProductsPage />} />
          <Route path="customers" element={<CustomersPage />} />
          <Route path="pos" element={<PosPage />} />
          <Route path="categories" element={<CategoriesPage />} />
<Route path="brands" element={<BrandsPage />} />
<Route path="promotions" element={<PromotionsPage />} />
<Route path="sales-history" element={<SalesHistoryPage />} />
<Route path="suppliers" element={<SuppliersPage />} />
<Route path="purchase-orders" element={<PurchaseOrdersPage />} />
<Route path="reports" element={<ReportsPage />} />
        </Route>
      </Routes>
    </AuthProvider>
  );
}

export default App;