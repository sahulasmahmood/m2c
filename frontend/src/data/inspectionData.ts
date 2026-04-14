import type { Vendor, ScheduledInspection, RecentInspection } from '@/types/inspection'

// Unified vendor data
export const vendors: Vendor[] = [
  {
    id: "nav-nit",
    name: "Nav Nit Group of Textiles",
    location: "Gujarat, India",
    recentPO: "PO-2024-001",
    status: "APPROVED",
    contactPerson: {
      name: "Rajesh Patel",
      designation: "Quality Manager",
      phone: "+91 98765 43210",
      email: "rajesh.patel@navnittextiles.com"
    },
    factory: {
      name: "Nav Nit Manufacturing Unit 1",
      address: "Plot No. 123, Textile Park, Ahmedabad - 380015, Gujarat",
      manager: "Priya Sharma",
      managerPhone: "+91 98765 43211",
      workingHours: "8:00 AM - 6:00 PM (Mon-Sat)"
    },
    performance: {
      totalInspections: 45,
      passRate: 91.1,
      averageScore: 8.7,
      onTimeDelivery: 94.4
    }
  },
  {
    id: "fabric-tech",
    name: "Fabric Tech Industries",
    location: "Tamil Nadu, India",
    recentPO: "PO-2024-002",
    status: "PENDING",
    contactPerson: {
      name: "Suresh Kumar",
      designation: "Production Manager",
      phone: "+91 98765 43212",
      email: "suresh.kumar@fabrictechindustries.com"
    },
    factory: {
      name: "Fabric Tech Manufacturing Unit",
      address: "Industrial Estate, Coimbatore - 641021, Tamil Nadu",
      manager: "Lakshmi Devi",
      managerPhone: "+91 98765 43213",
      workingHours: "7:00 AM - 7:00 PM (Mon-Sat)"
    },
    performance: {
      totalInspections: 32,
      passRate: 87.5,
      averageScore: 8.2,
      onTimeDelivery: 89.3
    }
  },
  {
    id: "weave-co",
    name: "Weave & Co",
    location: "Karnataka, India",
    recentPO: "PO-2024-003",
    status: "APPROVED",
    contactPerson: {
      name: "Arjun Reddy",
      designation: "Quality Head",
      phone: "+91 98765 43214",
      email: "arjun.reddy@weaveandco.com"
    },
    factory: {
      name: "Weave & Co Production Facility",
      address: "Textile Hub, Bangalore - 560045, Karnataka",
      manager: "Meera Nair",
      managerPhone: "+91 98765 43215",
      workingHours: "8:30 AM - 6:30 PM (Mon-Sat)"
    },
    performance: {
      totalInspections: 38,
      passRate: 94.7,
      averageScore: 9.1,
      onTimeDelivery: 96.8
    }
  },
  {
    id: "thread-masters",
    name: "Thread Masters",
    location: "Maharashtra, India",
    recentPO: "PO-2024-004",
    status: "APPROVED",
    contactPerson: {
      name: "Vikram Singh",
      designation: "Operations Manager",
      phone: "+91 98765 43216",
      email: "vikram.singh@threadmasters.com"
    },
    factory: {
      name: "Thread Masters Production Unit",
      address: "MIDC Area, Pune - 411019, Maharashtra",
      manager: "Anita Joshi",
      managerPhone: "+91 98765 43217",
      workingHours: "9:00 AM - 6:00 PM (Mon-Fri)"
    },
    performance: {
      totalInspections: 28,
      passRate: 85.7,
      averageScore: 8.0,
      onTimeDelivery: 92.1
    }
  },
  {
    id: "premium-fabrics",
    name: "Premium Fabrics Ltd",
    location: "Rajasthan, India",
    recentPO: "PO-2024-005",
    status: "UNDER_REVIEW",
    contactPerson: {
      name: "Deepak Agarwal",
      designation: "Quality Assurance Manager",
      phone: "+91 98765 43218",
      email: "deepak.agarwal@premiumfabrics.com"
    },
    factory: {
      name: "Premium Fabrics Manufacturing Complex",
      address: "Industrial Area, Jaipur - 302013, Rajasthan",
      manager: "Sunita Sharma",
      managerPhone: "+91 98765 43219",
      workingHours: "8:00 AM - 5:00 PM (Mon-Sat)"
    },
    performance: {
      totalInspections: 22,
      passRate: 90.9,
      averageScore: 8.5,
      onTimeDelivery: 88.6
    }
  }
]

// Scheduled inspections using the same vendor data
export const scheduledInspections: ScheduledInspection[] = [
  {
    id: 1,
    vendor: vendors[0], // Nav Nit Group of Textiles
    po: "PO-2024-006",
    scheduledDate: "2024-01-15",
    scheduledTime: "09:00 AM",
    priority: "high",
    itemsCount: 3,
    estimatedDuration: "4 hours",
    client: "Fashion Forward Inc.",
    items: [
      {
        id: 1,
        itemName: "Premium Cotton T-Shirts",
        description: "100% Organic Cotton Round Neck T-Shirts - Multiple Colors",
        quantity: 5000,
        inspectionQuantity: 315,
        specifications: "GSM: 180, Sizes: S-XXL, Colors: White, Black, Navy, Grey",
        aqlLevel: "2.5"
      },
      {
        id: 2,
        itemName: "Denim Jeans",
        description: "Slim Fit Blue Denim Jeans with Stretch",
        quantity: 3000,
        inspectionQuantity: 200,
        specifications: "Weight: 12oz, Sizes: 28-42, Wash: Stone Wash",
        aqlLevel: "2.5"
      },
      {
        id: 3,
        itemName: "Polo Shirts",
        description: "Cotton Pique Polo Shirts with Embroidered Logo",
        quantity: 2500,
        inspectionQuantity: 160,
        specifications: "GSM: 200, Sizes: S-XL, Colors: White, Navy, Red",
        aqlLevel: "1.5"
      }
    ],
    requirements: [
      "Visual inspection for defects",
      "Measurement verification",
      "Color fastness testing",
      "Fabric weight verification",
      "Packaging and labeling check",
      "Random sampling as per AQL standards"
    ],
    documents: [
      { name: "Purchase Order", status: "received" },
      { name: "Technical Specifications", status: "received" },
      { name: "Approved Samples", status: "pending" },
      { name: "Lab Test Reports", status: "not-required" }
    ]
  },
  {
    id: 2,
    vendor: vendors[1], // Fabric Tech Industries
    po: "PO-2024-007",
    scheduledDate: "2024-01-16",
    scheduledTime: "02:00 PM",
    priority: "medium",
    itemsCount: 2,
    estimatedDuration: "3 hours",
    client: "Urban Style Co.",
    items: [
      {
        id: 1,
        itemName: "Cotton Blend Shirts",
        description: "65% Cotton 35% Polyester Formal Shirts",
        quantity: 2000,
        inspectionQuantity: 125,
        specifications: "GSM: 120, Sizes: S-XL, Colors: White, Blue, Pink",
        aqlLevel: "2.5"
      },
      {
        id: 2,
        itemName: "Casual Trousers",
        description: "Cotton Twill Casual Trousers",
        quantity: 1500,
        inspectionQuantity: 80,
        specifications: "Weight: 280gsm, Sizes: 30-40, Colors: Khaki, Navy",
        aqlLevel: "2.5"
      }
    ],
    requirements: [
      "Visual inspection for defects",
      "Measurement verification",
      "Seam strength testing",
      "Packaging and labeling check"
    ],
    documents: [
      { name: "Purchase Order", status: "received" },
      { name: "Technical Specifications", status: "received" },
      { name: "Approved Samples", status: "received" },
      { name: "Lab Test Reports", status: "pending" }
    ]
  },
  {
    id: 3,
    vendor: vendors[2], // Weave & Co
    po: "PO-2024-008",
    scheduledDate: "2024-01-17",
    scheduledTime: "10:30 AM",
    priority: "low",
    itemsCount: 5,
    estimatedDuration: "6 hours",
    client: "Eco Fashion Brand",
    items: [
      {
        id: 1,
        itemName: "Organic Cotton Hoodies",
        description: "100% Organic Cotton Pullover Hoodies",
        quantity: 1000,
        inspectionQuantity: 80,
        specifications: "GSM: 320, Sizes: S-XXL, Colors: Grey, Black, Green",
        aqlLevel: "1.5"
      }
    ],
    requirements: [
      "Visual inspection for defects",
      "Measurement verification",
      "Organic certification check",
      "Packaging and labeling check"
    ],
    documents: [
      { name: "Purchase Order", status: "received" },
      { name: "Technical Specifications", status: "received" },
      { name: "Organic Certificates", status: "received" },
      { name: "Lab Test Reports", status: "not-required" }
    ]
  },
  {
    id: 4,
    vendor: vendors[3], // Thread Masters
    po: "PO-2024-009",
    scheduledDate: "2024-01-18",
    scheduledTime: "11:00 AM",
    priority: "high",
    itemsCount: 4,
    estimatedDuration: "5 hours",
    client: "Premium Retail Chain",
    items: [
      {
        id: 1,
        itemName: "Silk Blend Scarves",
        description: "70% Silk 30% Cotton Printed Scarves",
        quantity: 800,
        inspectionQuantity: 50,
        specifications: "Size: 90x90cm, Print: Digital, Colors: Assorted",
        aqlLevel: "1.0"
      }
    ],
    requirements: [
      "Visual inspection for defects",
      "Print quality verification",
      "Fabric composition testing",
      "Packaging and labeling check"
    ],
    documents: [
      { name: "Purchase Order", status: "received" },
      { name: "Technical Specifications", status: "pending" },
      { name: "Print Artwork", status: "received" },
      { name: "Lab Test Reports", status: "received" }
    ]
  },
  {
    id: 5,
    vendor: vendors[4], // Premium Fabrics Ltd
    po: "PO-2024-010",
    scheduledDate: "2024-01-19",
    scheduledTime: "08:30 AM",
    priority: "medium",
    itemsCount: 2,
    estimatedDuration: "3 hours",
    client: "Luxury Fashion House",
    items: [
      {
        id: 1,
        itemName: "Cashmere Blend Sweaters",
        description: "30% Cashmere 70% Wool Knitted Sweaters",
        quantity: 500,
        inspectionQuantity: 32,
        specifications: "Gauge: 12GG, Sizes: S-L, Colors: Cream, Grey, Navy",
        aqlLevel: "1.0"
      }
    ],
    requirements: [
      "Visual inspection for defects",
      "Measurement verification",
      "Fabric composition testing",
      "Luxury packaging check"
    ],
    documents: [
      { name: "Purchase Order", status: "received" },
      { name: "Technical Specifications", status: "received" },
      { name: "Material Certificates", status: "received" },
      { name: "Lab Test Reports", status: "not-required" }
    ]
  }
]

// Recent inspections data
export const recentInspections: RecentInspection[] = [
  { id: 1, vendor: "Nav Nit Group of Textiles", po: "PO-2024-001", status: "passed", date: "2024-01-08" },
  { id: 2, vendor: "Fabric Tech Industries", po: "PO-2024-002", status: "pending", date: "2024-01-08" },
  { id: 3, vendor: "Weave & Co", po: "PO-2024-003", status: "failed", date: "2024-01-07" },
  { id: 4, vendor: "Thread Masters", po: "PO-2024-004", status: "passed", date: "2024-01-07" },
  { id: 5, vendor: "Premium Fabrics Ltd", po: "PO-2024-005", status: "pending", date: "2024-01-06" },
]

// Helper functions
export const getVendorById = (id: string): Vendor | undefined => {
  return vendors.find(vendor => vendor.id === id)
}

export const getScheduledInspectionById = (id: number): ScheduledInspection | undefined => {
  return scheduledInspections.find(inspection => inspection.id === id)
}