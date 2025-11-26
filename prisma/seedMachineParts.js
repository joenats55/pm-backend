const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function seedMachineParts() {
  try {
    // Get a machine to add parts to
    const machine = await prisma.machine.findFirst();
    
    if (!machine) {
      console.log('No machines found. Please add a machine first.');
      return;
    }

    console.log(`Adding sample parts to machine: ${machine.name}`);

    const sampleParts = [
      {
        machineId: machine.id,
        partCode: 'BELT-001',
        partName: 'สายพานหลัก',
        description: 'สายพานลำเลียงหลักสำหรับเครื่องจักร',
        partCategory: 'สายพาน',
        uom: 'pcs',
        quantityOnHand: 5,
        minStockLevel: 2,
        location: 'ชั้น A-1',
        vendorName: 'บริษัท เจพีเบลท์ จำกัด',
        costPerUnit: 1500.00
      },
      {
        machineId: machine.id,
        partCode: 'MOTOR-001',
        partName: 'มอเตอร์ไฟฟ้า 3 แรงม้า',
        description: 'มอเตอร์ไฟฟ้า 3 เฟส 220/380V',
        partCategory: 'มอเตอร์',
        uom: 'pcs',
        quantityOnHand: 1,
        minStockLevel: 1,
        location: 'คลังมอเตอร์',
        vendorName: 'มิตซูบิชิ อีเล็คทริค',
        costPerUnit: 25000.00
      },
      {
        machineId: machine.id,
        partCode: 'BEARING-001',
        partName: 'แบริ่ง 6205',
        description: 'แบริ่งลูกปืนขนาด 6205',
        partCategory: 'แบริ่ง',
        uom: 'pcs',
        quantityOnHand: 10,
        minStockLevel: 5,
        location: 'ชั้น B-2',
        vendorName: 'SKF Thailand',
        costPerUnit: 350.00
      },
      {
        machineId: machine.id,
        partCode: 'OIL-001',
        partName: 'น้ำมันหล่อลื่น SAE 40',
        description: 'น้ำมันหล่อลื่นเครื่องจักร',
        partCategory: 'น้ำมัน',
        uom: 'ltr',
        quantityOnHand: 20,
        minStockLevel: 10,
        location: 'คลังน้ำมัน',
        vendorName: 'บางจาก คอร์ปอเรชั่น',
        costPerUnit: 450.00
      },
      {
        machineId: machine.id,
        partCode: 'FILTER-001',
        partName: 'ไส้กรองอากาศ',
        description: 'ไส้กรองอากาศสำหรับระบบอัดอากาศ',
        partCategory: 'ฟิลเตอร์',
        uom: 'pcs',
        quantityOnHand: 3,
        minStockLevel: 5,
        location: 'ชั้น C-1',
        vendorName: 'Mann Filter',
        costPerUnit: 850.00
      }
    ];

    for (const partData of sampleParts) {
      const part = await prisma.machinePart.create({
        data: partData
      });
      console.log(`Created part: ${part.partName} (${part.partCode})`);
    }

    console.log('Sample machine parts seeded successfully!');
  } catch (error) {
    console.error('Error seeding machine parts:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the seed function if this file is executed directly
if (require.main === module) {
  seedMachineParts();
}

module.exports = { seedMachineParts };
