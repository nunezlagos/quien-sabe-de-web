// --- Mock Data ---
const tradesList = [
    { name: 'Gasfiter', article: 'un' },
    { name: 'Electricista', article: 'un' },
    { name: 'Maestro', article: 'un' },
    { name: 'Jardinero', article: 'un' },
    { name: 'Programador', article: 'un' },
    { name: 'Pintor', article: 'un' },
    { name: 'Costurera', article: 'una' }
];

const communesList = [
    "Santiago", "Providencia", "Las Condes", "Ñuñoa", "La Florida", 
    "Maipú", "Puente Alto", "La Reina", "Vitacura", "Lo Barnechea",
    "San Miguel", "Estación Central", "Macul", "Peñalolén"
];

const neighborsData = [
    {
        id: 1,
        name: "Juan Pérez",
        trade: "Gasfiter",
        communes: ["Santiago", "Providencia", "Ñuñoa"],
        avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=200",
        coverImage: "https://images.unsplash.com/photo-1581244277943-fe4a9c777189?auto=format&fit=crop&q=80&w=1200",
        rating: 4.8,
        reviewsCount: 124,
        basePrice: 15000,
        bio: "Gasfiter certificado con 15 años de experiencia. Especialista en detección de fugas, instalación de calefonts y reparaciones de emergencia 24/7. Trabajo limpio y garantizado.",
        services: [
            { name: "Visita y Diagnóstico", price: 15000 },
            { name: "Destape de Cañerías", price: 35000 },
            { name: "Instalación Calefont", price: 45000 },
            { name: "Reparación Fugas", price: 30000 }
        ],
        portfolio: [
            "https://images.unsplash.com/photo-1581244277943-fe4a9c777189?auto=format&fit=crop&q=80&w=600",
            "https://images.unsplash.com/photo-1621905251189-08b45d6a269e?auto=format&fit=crop&q=80&w=600",
            "https://images.unsplash.com/photo-1504328345606-18bbc8c9d7d1?auto=format&fit=crop&q=80&w=600"
        ],
        reviews: [
            { user: "Ana M.", comment: "Muy puntual y limpio para trabajar. Lo recomiendo totalmente.", rating: 5 },
            { user: "Pedro S.", comment: "Solucionó el problema rápido, aunque llegó un poco tarde.", rating: 4.5 }
        ],
        contact: { phone: "+56911111111", whatsapp: "56911111111" }
    },
    {
        id: 2,
        name: "María González",
        trade: "Electricista",
        communes: ["Las Condes", "Vitacura", "Lo Barnechea"],
        avatar: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=200",
        coverImage: "https://images.unsplash.com/photo-1621905252507-b35a83013b2b?auto=format&fit=crop&q=80&w=1200",
        rating: 4.9,
        reviewsCount: 89,
        basePrice: 20000,
        bio: "Ingeniera eléctrica certificada SEC Clase A. Realizo desde cambios de enchufes hasta proyectos de iluminación completos. Seguridad y norma ante todo.",
        services: [
            { name: "Cambio de Enchufe/Int.", price: 20000 },
            { name: "Instalación Lámparas", price: 25000 },
            { name: "Certificación TE1", price: 80000 },
            { name: "Tableros Eléctricos", price: 120000 }
        ],
        portfolio: [
            "https://images.unsplash.com/photo-1621905252507-b35a83013b2b?auto=format&fit=crop&q=80&w=600",
            "https://images.unsplash.com/photo-1558346490-a72e53ae2d4f?auto=format&fit=crop&q=80&w=600",
            "https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&q=80&w=600"
        ],
        reviews: [
            { user: "Luisa K.", comment: "Excelente profesional, me explicó todo el proceso.", rating: 5 },
            { user: "Carlos R.", comment: "Muy ordenada y prolija.", rating: 5 }
        ],
        contact: { phone: "+56922222222", whatsapp: "56922222222" }
    },
    {
        id: 3,
        name: "Pedro Tapia",
        trade: "Jardinero",
        communes: ["La Florida", "Puente Alto", "La Reina"],
        avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=200",
        coverImage: "https://images.unsplash.com/photo-1558904541-efa843a96f01?auto=format&fit=crop&q=80&w=1200",
        rating: 4.6,
        reviewsCount: 45,
        basePrice: 15000,
        bio: "Paisajista autodidacta con amor por la naturaleza. Mantención de jardines, poda de altura, sistemas de riego y recuperación de áreas verdes.",
        services: [
            { name: "Corte de Pasto", price: 15000 },
            { name: "Poda de Arbustos", price: 20000 },
            { name: "Limpieza y Desmalezado", price: 25000 },
            { name: "Mantención Riego", price: 30000 }
        ],
        portfolio: [
            "https://images.unsplash.com/photo-1558904541-efa843a96f01?auto=format&fit=crop&q=80&w=600",
            "https://images.unsplash.com/photo-1585320806297-9794b3e4eeae?auto=format&fit=crop&q=80&w=600",
            "https://images.unsplash.com/photo-1599689018228-5696c5678229?auto=format&fit=crop&q=80&w=600"
        ],
        reviews: [
            { user: "Marta L.", comment: "Dejó mi jardín hermoso.", rating: 5 }
        ],
        contact: { phone: "+56933333333", whatsapp: "56933333333" }
    },
    {
        id: 4,
        name: "Ana Silva",
        trade: "Costurera",
        rating: 5.0,
        reviewsCount: 210,
        basePrice: 5000,
        communes: ["Santiago", "San Miguel", "Estación Central"],
        coverImage: "https://images.unsplash.com/photo-1556905055-8f358a7a47b2?auto=format&fit=crop&q=80&w=1200",
        bio: "Arreglos de ropa en general, cambios de cierre, bastas y confecciones a medida. Rápida entrega.",
        services: [
            { name: "Basta pantalón", price: 5000 },
            { name: "Cambio cierre", price: 8000 },
            { name: "Ajuste vestido", price: 12000 }
        ],
        portfolio: [
            "https://images.unsplash.com/photo-1556905055-8f358a7a47b2?auto=format&fit=crop&q=80&w=400"
        ],
        reviews: [],
        contact: { phone: "+56944444444", whatsapp: "56944444444" }
    },
    {
        id: 5,
        name: "Carlos Ruiz",
        trade: "Maestro",
        rating: 4.3,
        reviewsCount: 32,
        basePrice: 30000,
        communes: ["Maipú", "Estación Central", "Santiago"],
        coverImage: "https://images.unsplash.com/photo-1503387762-592deb58ef4e?auto=format&fit=crop&q=80&w=1200",
        bio: "Maestro chasquilla pro. Hago de todo un poco: albañilería, pintura, cerámica y reparaciones menores.",
        services: [
            { name: "Instalación cerámica", price: 12000 }, // por m2
            { name: "Tabiquería", price: 15000 },
            { name: "Pintura fachada", price: 40000 }
        ],
        portfolio: [],
        reviews: [],
        contact: { phone: "+56955555555", whatsapp: "56955555555", email: "carlos.ruiz@example.com" }
    },
    {
        id: 6,
        name: "Luisa Méndez",
        trade: "Programador",
        rating: 4.9,
        reviewsCount: 15,
        basePrice: 25000,
        communes: ["Providencia", "Ñuñoa", "Macul", "Peñalolén"],
        coverImage: "https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&q=80&w=1200",
        bio: "Te ayudo con la tecnología. Desde arreglar tu PC lento hasta crear la página web de tu emprendimiento.",
        services: [
            { name: "Sitio Web Básico", price: 150000 },
            { name: "Arreglo PC", price: 25000 },
            { name: "Clases Excel", price: 15000 }
        ],
        portfolio: [
            "https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&q=80&w=400"
        ],
        reviews: [],
        contact: { phone: "+56966666666", whatsapp: "56966666666", email: "luisa.mendez@example.com" }
    },
    {
        id: 7,
        name: "Maximiliano Alejandro Valenzuela Sotomayor",
        trade: "Multiusos Pro",
        rating: 5.0,
        reviewsCount: 342,
        basePrice: 10000,
        communes: ["Santiago", "Providencia", "Las Condes", "Vitacura", "Lo Barnechea", "Ñuñoa", "La Reina", "Macul", "Peñalolén", "La Florida", "Puente Alto", "San Miguel", "Estación Central", "Maipú"],
        coverImage: "https://images.unsplash.com/photo-1541888946425-d81bb19240f5?auto=format&fit=crop&q=80&w=1200",
        bio: "Especialista en soluciones integrales para el hogar y la oficina. Con más de 20 años de experiencia, ofrezco un servicio completo que abarca desde reparaciones menores hasta remodelaciones complejas. Mi enfoque es la calidad, la limpieza y la puntualidad. Si tienes un problema que nadie más puede resolver, yo soy la persona indicada. Trabajo con herramientas de última generación y materiales certificados para asegurar resultados duraderos.",
        services: [
            { name: "Instalación de Cámaras de Seguridad", price: 45000 },
            { name: "Domótica y Smart Home", price: 60000 },
            { name: "Reparación de Aire Acondicionado", price: 35000 },
            { name: "Mantención de Piscinas", price: 50000 },
            { name: "Pintura Interior y Exterior", price: 40000 },
            { name: "Carpintería a Medida", price: 80000 },
            { name: "Gasfitería de Alta Complejidad", price: 55000 },
            { name: "Electricidad Industrial", price: 90000 },
            { name: "Limpieza de Alfombras", price: 25000 },
            { name: "Armado de Muebles", price: 20000 },
            { name: "Cerrajería de Emergencia", price: 30000 },
            { name: "Fumigación y Control de Plagas", price: 45000 }
        ],
        portfolio: [
            "https://images.unsplash.com/photo-1581244277943-fe4a9c777189?auto=format&fit=crop&q=80&w=600",
            "https://images.unsplash.com/photo-1621905251189-08b45d6a269e?auto=format&fit=crop&q=80&w=600",
            "https://images.unsplash.com/photo-1504328345606-18bbc8c9d7d1?auto=format&fit=crop&q=80&w=600",
            "https://images.unsplash.com/photo-1558904541-efa843a96f01?auto=format&fit=crop&q=80&w=600",
            "https://images.unsplash.com/photo-1585320806297-9794b3e4eeae?auto=format&fit=crop&q=80&w=600",
            "https://images.unsplash.com/photo-1599689018228-5696c5678229?auto=format&fit=crop&q=80&w=600"
        ],
        reviews: [
            { user: "Fernanda T.", comment: "Increíble servicio, hizo de todo en mi casa en un solo día.", rating: 5 },
            { user: "Jorge M.", comment: "Muy profesional y amable. Lo recomiendo 100%.", rating: 5 },
            { user: "Camila V.", comment: "Me salvó de una emergencia un domingo. Excelente disposición.", rating: 5 }
        ],
        contact: { phone: "+56977777777", whatsapp: "56977777777", email: "maximiliano.valenzuela@example.com" }
    },
    {
        id: 8,
        name: "Rigoberto Echeverria",
        trade: "Gasfiter | Electricista | Carpintero | Soldador | Albañil | Pintor",
        verified: true,
        rating: 4.9,
        reviewsCount: 1250,
        basePrice: 5000,
        communes: ["Santiago", "Providencia", "Las Condes", "Vitacura", "Lo Barnechea", "Ñuñoa", "La Reina", "Macul", "Peñalolén", "La Florida", "Puente Alto", "San Miguel", "Estación Central", "Maipú", "Cerrillos", "Quilicura", "Huechuraba", "Recoleta", "Independencia"],
        coverImage: "https://images.unsplash.com/photo-1504328345606-18bbc8c9d7d1?auto=format&fit=crop&q=80&w=1200",
        bio: "Soy el profesional más completo que encontrarás. Tengo certificaciones en todas las áreas de la construcción y mantención del hogar. Mi nombre es largo, pero mi lista de habilidades es aún más larga. Atiendo urgencias las 24 horas del día, los 7 días de la semana, en todas las comunas de la Región Metropolitana. Trabajo garantizado y con boleta o factura según lo necesites.",
        services: [
            { name: "Destape de Cañerías con Maquinaria Industrial", price: 45000 },
            { name: "Instalación de Calefont Ionizado", price: 55000 },
            { name: "Cambio de Automáticos y Diferenciales", price: 35000 },
            { name: "Construcción de Muebles de Cocina a Medida", price: 250000 },
            { name: "Soldadura de Rejas y Portones", price: 60000 },
            { name: "Estuco y Pintura de Fachadas (m2)", price: 15000 },
            { name: "Instalación de Cerámica y Porcelanato (m2)", price: 18000 },
            { name: "Reparación de Techos y Goteras", price: 40000 },
            { name: "Instalación de Aire Acondicionado Split", price: 90000 },
            { name: "Mantención de Jardines y Poda de Altura", price: 50000 },
            { name: "Limpieza de Canaletas", price: 30000 },
            { name: "Cambio de Cerraduras de Alta Seguridad", price: 45000 },
            { name: "Instalación de Cortinas y Roller", price: 15000 },
            { name: "Armado de Muebles Retail", price: 25000 },
            { name: "Reparación de Electrodomésticos Menores", price: 20000 },
            { name: "Instalación de Lámparas y Apliqués", price: 15000 },
            { name: "Detección de Fugas de Gas Certificada", price: 35000 },
            { name: "Cambio de Grifería Baño y Cocina", price: 25000 },
            { name: "Impermeabilización de Terrazas", price: 80000 },
            { name: "Construcción de Cobertizos de Madera", price: 150000 },
            { name: "Remodelación Completa de Baños", price: 450000 },
            { name: "Pintura Decorativa de Interiores", price: 35000 }
        ],
        portfolio: [
            "https://images.unsplash.com/photo-1581244277943-fe4a9c777189?auto=format&fit=crop&q=80&w=600",
            "https://images.unsplash.com/photo-1621905251189-08b45d6a269e?auto=format&fit=crop&q=80&w=600",
            "https://images.unsplash.com/photo-1504328345606-18bbc8c9d7d1?auto=format&fit=crop&q=80&w=600",
            "https://images.unsplash.com/photo-1558904541-efa843a96f01?auto=format&fit=crop&q=80&w=600",
            "https://images.unsplash.com/photo-1585320806297-9794b3e4eeae?auto=format&fit=crop&q=80&w=600",
            "https://images.unsplash.com/photo-1599689018228-5696c5678229?auto=format&fit=crop&q=80&w=600"
        ],
        reviews: [
            { user: "Roberto P.", comment: "Es un genio, arregló todo.", rating: 5 },
            { user: "Patricia S.", comment: "Muy largo el nombre pero muy bueno el trabajo.", rating: 5 }
        ],
        contact: { phone: "+56988888888", whatsapp: "56988888888", email: "esteban.valdebenito.echeverria@example.com" }
    }
];
