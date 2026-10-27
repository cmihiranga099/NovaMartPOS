async function seed() {
  const loginRes = await fetch('http://localhost:5026/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: 'admin', password: 'Admin@123' })
  });

  if (!loginRes.ok) {
    throw new Error('Login failed: ' + (await loginRes.text()));
  }

  const { token } = await loginRes.json();
  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  };

  console.log('Logged in successfully.');

  const suppliersToSeed = [
    {
      key: 'nestle',
      name: 'Nestlé Lanka PLC',
      phone: '011-2699991',
      email: 'consumer.services@lk.nestle.com',
      address: 'No. 440, T.B. Jayah Mawatha, Colombo 10',
      logoUrl: '/suppliers/nestle.svg',
      isActive: true,
      matches: ['Nestlé', 'Milo', 'Maggi', 'Nescafe']
    },
    {
      key: 'fonterra',
      name: 'Fonterra Brands Lanka (Anchor)',
      phone: '011-2488888',
      email: 'consumerservices@fonterra.com',
      address: '100, Delgoda Road, Biyagama',
      logoUrl: '/suppliers/fonterra.svg',
      isActive: true,
      matches: ['Anchor']
    },
    {
      key: 'cbl',
      name: 'Ceylon Biscuits Limited (CBL / Munchee)',
      phone: '011-5000000',
      email: 'inquiry@muncheelk.com',
      address: 'PO Box 3, High Level Road, Makumbura, Pannipitiya',
      logoUrl: '/suppliers/cbl.png',
      isActive: true,
      matches: ['Munchee', 'Tiara', 'Ritzbury']
    },
    {
      key: 'maliban',
      name: 'Maliban Biscuit Manufactories (Pvt) Ltd',
      phone: '011-5555000',
      email: 'info@malibanbiscuit.com',
      address: '389, Galle Road, Ratmalana',
      logoUrl: '/suppliers/maliban.png',
      isActive: true,
      matches: ['Maliban']
    },
    {
      key: 'elephanthouse',
      name: 'Ceylon Cold Stores PLC (Elephant House)',
      phone: '011-2318798',
      email: 'info.ccs@keells.com',
      address: '148, Vauxhall Street, Colombo 02',
      logoUrl: '/suppliers/elephanthouse.png',
      isActive: true,
      matches: ['Elephant House', 'EGB']
    },
    {
      key: 'dilmah',
      name: 'Dilmah Ceylon Tea Company PLC',
      phone: '011-4822000',
      email: 'info@dilmahtea.com',
      address: '111, Negombo Road, Peliyagoda',
      logoUrl: '/suppliers/dilmah.svg',
      isActive: true,
      matches: ['Dilmah']
    },
    {
      key: 'kotmale',
      name: 'Kotmale Dairy Products (Cargills)',
      phone: '011-2427777',
      email: 'dairy@cargillsceylon.com',
      address: '40, York Street, Colombo 01',
      logoUrl: '/suppliers/kotmale.svg',
      isActive: true,
      matches: ['Kotmale']
    },
    {
      key: 'unilever',
      name: 'Unilever Sri Lanka',
      phone: '011-2180000',
      email: 'consumercare.srilanka@unilever.com',
      address: '258, M. Vincent Perera Mawatha, Colombo 14',
      logoUrl: '/suppliers/unilever.svg',
      isActive: true,
      matches: ['Sunlight', 'Signal', 'Lifebuoy', 'Astra']
    },
    {
      key: 'prima',
      name: 'Prima Ceylon (Private) Limited',
      phone: '011-2864281',
      email: 'info.pcl@prima.com.lk',
      address: 'No. 50, Sri Jayawardenepura Mawatha, Rajagiriya',
      logoUrl: '/suppliers/prima.svg',
      isActive: true,
      matches: ['Prima']
    },
    {
      key: 'harischandra',
      name: 'Harischandra Mills PLC',
      phone: '041-2222441',
      email: 'info@harischandramills.com',
      address: 'No. 11, C.A. Harischandra Mawatha, Matara',
      logoUrl: '/suppliers/harischandra.jpg',
      isActive: true,
      matches: ['Harischandra']
    },
    {
      key: 'md',
      name: 'Lanka Canneries (Pvt) Ltd (MD)',
      phone: '011-2586622',
      email: 'info@lankacanneries.com',
      address: 'No. 24, Narahenpita Road, Nawala, Rajagiriya',
      logoUrl: '/suppliers/md.png',
      isActive: true,
      matches: ['MD Strawberry', 'MD ']
    },
    {
      key: 'nuwaraeliya',
      name: 'Nuwara Eliya Farmers Cooperative Society',
      phone: '052-2222145',
      email: 'orders@nuwaraeliya-coop.lk',
      address: 'Central Vegetable Market, Nuwara Eliya',
      logoUrl: '/suppliers/nuwaraeliya.svg',
      isActive: true,
      matches: ['Tomatoes', 'Bananas', 'Apples', 'Onions', 'Carrots', 'Potatoes', 'Chillies']
    },
    {
      key: 'bairaha',
      name: 'Ceylon Agro-Industries / Bairaha Farms PLC',
      phone: '011-2575255',
      email: 'bairaha@sltnet.lk',
      address: 'No. 407, Galle Road, Colombo 03',
      logoUrl: '/suppliers/bairaha.png',
      isActive: true,
      matches: ['Chicken', 'Poultry']
    },
    {
      key: 'peliyagodafish',
      name: 'Peliyagoda Fish Distributors (Ceylon Fisheries)',
      phone: '011-2915432',
      email: 'sales@peliyagodafish.lk',
      address: 'Central Fish Market Complex, Peliyagoda',
      logoUrl: '/suppliers/peliyagoda-fish.svg',
      isActive: true,
      matches: ['Tuna', 'Fish', 'Thalapath']
    }
  ];

  // 1. Get existing suppliers
  const res = await fetch('http://localhost:5026/api/suppliers', { headers });
  const existing = await res.json();
  console.log(`Found ${existing.length} existing suppliers.`);

  const supplierMap = new Map();

  for (const item of suppliersToSeed) {
    const found = existing.find(s =>
      s.name.toLowerCase().includes(item.key) ||
      item.name.toLowerCase().includes(s.name.toLowerCase()) ||
      s.name.toLowerCase().includes('nestle') && item.key === 'nestle'
    );

    if (found) {
      console.log(`Updating existing supplier ${found.id}: ${item.name}`);
      const updateRes = await fetch(`http://localhost:5026/api/suppliers/${found.id}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify({
          name: item.name,
          phone: item.phone,
          email: item.email,
          address: item.address,
          logoUrl: item.logoUrl,
          isActive: item.isActive
        })
      });
      if (!updateRes.ok) {
        console.error(`Update failed for ${found.id}:`, await updateRes.text());
      }
      supplierMap.set(item.key, found.id);
    } else {
      console.log(`Creating supplier: ${item.name}`);
      const createRes = await fetch('http://localhost:5026/api/suppliers', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          name: item.name,
          phone: item.phone,
          email: item.email,
          address: item.address,
          logoUrl: item.logoUrl
        })
      });
      if (!createRes.ok) {
        console.error(`Create failed for ${item.name}:`, await createRes.text());
      } else {
        const created = await createRes.json();
        supplierMap.set(item.key, created.id);
      }
    }
  }

  // 2. Fetch all suppliers again to get their IDs
  const allSuppliersRes = await fetch('http://localhost:5026/api/suppliers', { headers });
  const allSuppliers = await allSuppliersRes.json();
  console.log(`Now there are ${allSuppliers.length} suppliers in DB.`);

  // 3. Link products to suppliers
  const prodsRes = await fetch('http://localhost:5026/api/products', { headers });
  const products = await prodsRes.json();
  console.log(`Checking ${products.length} products to link with suppliers...`);

  for (const p of products) {
    let matchedSupplier = null;
    for (const seedItem of suppliersToSeed) {
      const match = seedItem.matches.some(m => p.name.toLowerCase().includes(m.toLowerCase()));
      if (match) {
        matchedSupplier = allSuppliers.find(s => s.name === seedItem.name);
        break;
      }
    }

    if (matchedSupplier && p.supplierId !== matchedSupplier.id) {
      console.log(`Linking product "${p.name}" (id: ${p.id}) -> supplier "${matchedSupplier.name}" (id: ${matchedSupplier.id})`);
      const updateProdRes = await fetch(`http://localhost:5026/api/products/${p.id}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify({
          productCode: p.productCode,
          barcode: p.barcode,
          name: p.name,
          imageUrl: p.imageUrl,
          purchasePrice: p.purchasePrice,
          sellingPrice: p.sellingPrice,
          taxRate: p.taxRate,
          stockQuantity: p.stockQuantity,
          minimumStockLevel: p.minimumStockLevel,
          isWeighable: p.isWeighable,
          unitOfMeasure: p.unitOfMeasure,
          categoryId: p.categoryId,
          brandId: p.brandId,
          supplierId: matchedSupplier.id,
          expiryDate: p.expiryDate,
          isActive: p.isActive
        })
      });
      if (!updateProdRes.ok) {
        console.error(`Failed to link product ${p.id}:`, await updateProdRes.text());
      }
    }
  }

  console.log('Seed and product linking completed successfully!');
}

seed().catch(console.error);
