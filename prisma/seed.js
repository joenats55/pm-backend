require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting to seed the database...');

  // Create default roles
  const roles = [
    {
      name: 'ADMIN',
      description: 'System administrator with full access to all features'
    },
    {
      name: 'TECHNICIAN',
      description: 'Technician who performs maintenance and repairs'
    },
    {
      name: 'CUSTOMER',
      description: 'Customer who can view and request services'
    }
  ];

  console.log('📝 Creating default roles...');

  for (const roleData of roles) {
    const role = await prisma.role.upsert({
      where: { name: roleData.name },
      update: {
        description: roleData.description
      },
      create: {
        name: roleData.name,
        description: roleData.description
      }
    });
    console.log(`✅ Created/Updated role: ${role.name}`);
  }

  // Get admin role for creating test user
  const adminRole = await prisma.role.findUnique({
    where: { name: 'ADMIN' }
  });

  // Create test admin user
  console.log('👤 Creating test admin user...');
  
  const testAdminEmail = 'admin@takeco.com';
  const testAdminPassword = 'admin123'; // Change this in production!
  
  // Hash the password
  const hashedPassword = await bcrypt.hash(testAdminPassword, 12);
  
  const testAdmin = await prisma.user.upsert({
    where: { email: testAdminEmail },
    update: {
      username: 'admin',
      passwordHash: hashedPassword,
      roleId: adminRole.id,
      isActive: true
    },
    create: {
      fullName: 'Test Admin',
      username: 'admin',
      email: testAdminEmail,
      passwordHash: hashedPassword,
      roleId: adminRole.id,
      phoneNumber: '+66-123-456-789',
      isActive: true
    }
  });
  
  console.log(`✅ Created/Updated test admin user: ${testAdmin.email}`);
  console.log(`🔑 Password: ${testAdminPassword}`);

  // Create sample company
  console.log('🏢 Creating sample company...');
  const sampleCompany = await prisma.company.upsert({
    where: { name: 'Takeco Industries' },
    update: {
      tel: '+66-2-123-4567',
      email: 'info@takeco.com',
      detail: 'Leading industrial maintenance company'
    },
    create: {
      name: 'Takeco Industries',
      tel: '+66-2-123-4567',
      email: 'info@takeco.com',
      detail: 'Leading industrial maintenance company',
      address: '123 Industrial Road, Bangkok',
      zipCode: 10100
    }
  });
  console.log(`✅ Created/Updated company: ${sampleCompany.name}`);

  // Create sample machines
  console.log('🏭 Creating sample machines...');
  const sampleMachines = [
    {
      machineCode: 'MCH-001',
      name: 'Industrial Pump A1',
      category: 'ปั๊ม',
      model: 'XP-5000',
      serialNumber: 'SN-001-2024',
      installationDate: new Date('2024-01-15'),
      location: 'Line A - Station 1',
      status: 'ACTIVE',
      companyId: sampleCompany.id,
      description: 'Primary water circulation pump for Line A'
    },
    {
      machineCode: 'MCH-002',
      name: 'Conveyor Belt System',
      category: 'สายพานลำเลียง',
      model: 'CB-2000',
      serialNumber: 'SN-002-2024',
      installationDate: new Date('2024-02-20'),
      location: 'Line B - Transport',
      status: 'ACTIVE',
      companyId: sampleCompany.id,
      description: 'Main conveyor system for production line B'
    },
    {
      machineCode: 'MCH-003',
      name: 'CNC Milling Machine',
      category: 'เครื่องกลึง',
      model: 'CNC-3000',
      serialNumber: 'SN-003-2024',
      installationDate: new Date('2024-03-10'),
      location: 'Line C - Machining',
      status: 'MAINTENANCE',
      companyId: sampleCompany.id,
      description: 'High precision CNC milling machine'
    },
    {
      machineCode: 'MCH-004',
      name: 'Hydraulic Press',
      category: 'เครื่องกด',
      model: 'HP-1500',
      serialNumber: 'SN-004-2024',
      installationDate: new Date('2024-04-05'),
      location: 'Line D - Station 1',
      status: 'ACTIVE',
      companyId: sampleCompany.id,
      description: 'Heavy duty hydraulic press machine'
    },
    {
      machineCode: 'MCH-005',
      name: 'Air Compressor Unit',
      category: 'คอมเพรสเซอร์',
      model: 'AC-800',
      serialNumber: 'SN-005-2024',
      installationDate: new Date('2024-05-12'),
      location: 'Utility Room',
      status: 'INACTIVE',
      companyId: sampleCompany.id,
      description: 'Central air compressor for pneumatic tools'
    }
  ];

  for (const machineData of sampleMachines) {
    const machine = await prisma.machine.upsert({
      where: { machineCode: machineData.machineCode },
      update: machineData,
      create: machineData
    });
    console.log(`✅ Created/Updated machine: ${machine.machineCode} - ${machine.name}`);
  }

  // Create sample machine parts
  console.log('🔧 Creating sample machine parts...');
  
  // Get the created machines
  const machines = await prisma.machine.findMany();
  
  const sampleMachineParts = [];
  
  // Add parts for each machine
  for (const machine of machines) {
    const partsForMachine = [
      {
        machineId: machine.id,
        partCode: `${machine.machineCode}-PART-001`,
        partName: 'Filter Element',
        description: 'Primary filtration element',
        partCategory: 'Filter',
        uom: 'pcs',
        quantityOnHand: 15,
        minStockLevel: 5,
        location: 'Storage A-1',
        vendorName: 'Industrial Parts Co.',
        costPerUnit: 150.00
      },
      {
        machineId: machine.id,
        partCode: `${machine.machineCode}-PART-002`,
        partName: 'Bearing Set',
        description: 'Main shaft bearing assembly',
        partCategory: 'Bearing',
        uom: 'set',
        quantityOnHand: 8,
        minStockLevel: 3,
        location: 'Storage A-2',
        vendorName: 'Bearing Solutions Ltd.',
        costPerUnit: 450.00
      },
      {
        machineId: machine.id,
        partCode: `${machine.machineCode}-PART-003`,
        partName: 'Oil Seal',
        description: 'Hydraulic oil seal',
        partCategory: 'Seal',
        uom: 'pcs',
        quantityOnHand: 25,
        minStockLevel: 10,
        location: 'Storage B-1',
        vendorName: 'Seal Tech Inc.',
        costPerUnit: 75.50
      },
      {
        machineId: machine.id,
        partCode: `${machine.machineCode}-PART-004`,
        partName: 'Drive Belt',
        description: 'Primary drive belt',
        partCategory: 'Belt',
        uom: 'pcs',
        quantityOnHand: 4,
        minStockLevel: 2,
        location: 'Storage B-2',
        vendorName: 'Power Transmission Co.',
        costPerUnit: 280.00
      },
      {
        machineId: machine.id,
        partCode: `${machine.machineCode}-PART-005`,
        partName: 'Control Valve',
        description: 'Pressure control valve',
        partCategory: 'Valve',
        uom: 'pcs',
        quantityOnHand: 2,
        minStockLevel: 1,
        location: 'Storage C-1',
        vendorName: 'Hydraulic Systems Ltd.',
        costPerUnit: 650.00
      }
    ];
    
    sampleMachineParts.push(...partsForMachine);
  }
  
  // Insert machine parts
  for (const partData of sampleMachineParts) {
    try {
      const part = await prisma.machinePart.create({
        data: partData
      });
      console.log(`✅ Created machine part: ${part.partCode} - ${part.partName}`);
    } catch (error) {
      console.log(`⚠️  Skipping duplicate part: ${partData.partCode}`);
    }
  }

  console.log('🎉 Database seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
