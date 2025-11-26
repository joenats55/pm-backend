const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const pmTemplateData = [
  {
    name: 'PM ปั๊มลมรายเดือน',
    description: 'การตรวจสอบและบำรุงรักษาปั๊มลมตามมาตรฐาน TPM',
    machineType: 'Air Compressor',
    frequencyType: 'monthly',
    frequencyValue: 1,
    durationMinutes: 120,
    standard: 'TPM',
    items: [
      {
        stepOrder: 1,
        checkItem: 'ตรวจสอบเสียงผิดปกติ',
        category: 'ตรวจสอบด้วยการฟัง',
        standardValue: 'ไม่มีเสียงผิดปกติ',
        method: 'ฟัง',
        toolsRequired: '-',
        isRequired: true,
        hasSignature: false,
        hasPhoto: false
      },
      {
        stepOrder: 2,
        checkItem: 'ตรวจสอบแรงดันลม',
        category: 'วัดค่า',
        standardValue: '7-8 bar',
        unit: 'bar',
        method: 'เครื่องวัดแรงดัน',
        toolsRequired: 'Pressure Gauge',
        isRequired: true,
        hasSignature: true,
        hasPhoto: true
      },
      {
        stepOrder: 3,
        checkItem: 'ตรวจสอบและเติมน้ำมันหล่อลื่น',
        category: 'บำรุงรักษา',
        standardValue: 'ระดับน้ำมันอยู่ในช่วง Min-Max',
        method: 'สายตา',
        toolsRequired: 'น้ำมันหล่อลื่น',
        isRequired: true,
        hasSignature: true,
        hasPhoto: false
      },
      {
        stepOrder: 4,
        checkItem: 'ตรวจสอบการรั่วซึมของน้ำมัน',
        category: 'ตรวจสอบด้วยสายตา',
        standardValue: 'ไม่มีการรั่วซึม',
        method: 'สายตา',
        toolsRequired: '-',
        isRequired: true,
        hasSignature: false,
        hasPhoto: true
      },
      {
        stepOrder: 5,
        checkItem: 'ทำความสะอาดตัวกรองอากาศ',
        category: 'บำรุงรักษา',
        standardValue: 'สะอาด ไม่มีฝุ่น',
        method: 'ทำความสะอาด',
        toolsRequired: 'แปรงขัด, น้ำ',
        isRequired: true,
        hasSignature: true,
        hasPhoto: true
      }
    ]
  },
  {
    name: 'PM สายพานลำเลียงรายสัปดาห์',
    description: 'การตรวจสอบสายพานลำเลียงตามมาตรฐาน ISO 9001',
    machineType: 'Conveyor Belt',
    frequencyType: 'weekly',
    frequencyValue: 1,
    durationMinutes: 60,
    standard: 'ISO 9001',
    items: [
      {
        stepOrder: 1,
        checkItem: 'ตรวจสอบความตึงของสายพาน',
        category: 'ตรวจสอบกลไก',
        standardValue: 'ความตึงปกติ ไม่หย่อนเกินไป',
        method: 'กด',
        toolsRequired: 'มือ',
        isRequired: true,
        hasSignature: false,
        hasPhoto: true
      },
      {
        stepOrder: 2,
        checkItem: 'ตรวจสอบการสึกหรอของสายพาน',
        category: 'ตรวจสอบด้วยสายตา',
        standardValue: 'ไม่มีรอยแตก หรือ สึกหรอ',
        method: 'สายตา',
        toolsRequired: '-',
        isRequired: true,
        hasSignature: true,
        hasPhoto: true
      },
      {
        stepOrder: 3,
        checkItem: 'ตรวจสอบการเรียงตัวของสายพาน',
        category: 'ตรวจสอบด้วยสายตา',
        standardValue: 'เรียงตัวตรง ไม่เบี่ยง',
        method: 'สายตา',
        toolsRequired: '-',
        isRequired: true,
        hasSignature: false,
        hasPhoto: true
      },
      {
        stepOrder: 4,
        checkItem: 'ทำความสะอาดสายพานและลูกกลิ้ง',
        category: 'บำรุงรักษา',
        standardValue: 'สะอาด ไม่มีสิ่งแปลกปลอม',
        method: 'ทำความสะอาด',
        toolsRequired: 'แปรง, ผ้า',
        isRequired: true,
        hasSignature: true,
        hasPhoto: false
      }
    ]
  },
  {
    name: 'PM อุปกรณ์ความปลอดภัยรายวัน (GMP)',
    description: 'การตรวจสอบอุปกรณ์ความปลอดภัยตามมาตรฐาน GMP',
    machineType: 'Safety Equipment',
    frequencyType: 'daily',
    frequencyValue: 1,
    durationMinutes: 30,
    standard: 'GMP',
    items: [
      {
        stepOrder: 1,
        checkItem: 'ตรวจสอบการทำงานของเซ็นเซอร์',
        category: 'ทดสอบการทำงาน',
        standardValue: 'ทำงานปกติ มีสัญญาณเตือน',
        method: 'ทดสอบ',
        toolsRequired: 'Test Equipment',
        isRequired: true,
        hasSignature: true,
        hasPhoto: false
      },
      {
        stepOrder: 2,
        checkItem: 'ตรวจสอบไฟแสดงสถานะ',
        category: 'ตรวจสอบด้วยสายตา',
        standardValue: 'ไฟติดเป็นสีเขียว',
        method: 'สายตา',
        toolsRequired: '-',
        isRequired: true,
        hasSignature: false,
        hasPhoto: true
      },
      {
        stepOrder: 3,
        checkItem: 'ทดสอบปุ่มฉุกเฉิน',
        category: 'ทดสอบการทำงาน',
        standardValue: 'หยุดการทำงานได้ทันที',
        method: 'ทดสอบ',
        toolsRequired: '-',
        isRequired: true,
        hasSignature: true,
        hasPhoto: false
      }
    ]
  },
  {
    name: 'PM ระบบไฟฟ้าตามมาตรฐาน HACCP',
    description: 'การตรวจสอบระบบไฟฟ้าและการควบคุมตามมาตรฐาน HACCP',
    machineType: 'Electrical Panel',
    frequencyType: 'monthly',
    frequencyValue: 3,
    durationMinutes: 180,
    standard: 'HACCP',
    items: [
      {
        stepOrder: 1,
        checkItem: 'ตรวจสอบอุณหภูมิของตู้ควบคุม',
        category: 'วัดค่า',
        standardValue: 'ไม่เกิน 40°C',
        unit: '°C',
        method: 'เครื่องวัดอุณหภูมิ',
        toolsRequired: 'Thermometer',
        isRequired: true,
        hasSignature: true,
        hasPhoto: true
      },
      {
        stepOrder: 2,
        checkItem: 'ตรวจสอบการต่อสายไฟ',
        category: 'ตรวจสอบด้วยสายตา',
        standardValue: 'แน่น ไม่หลวม ไม่มีการออกซิไดซ์',
        method: 'สายตา',
        toolsRequired: 'ไขควง',
        isRequired: true,
        hasSignature: true,
        hasPhoto: true
      },
      {
        stepOrder: 3,
        checkItem: 'ทำความสะอาดภายในตู้ควบคุม',
        category: 'บำรุงรักษา',
        standardValue: 'ไม่มีฝุ่น สะอาด',
        method: 'ทำความสะอาด',
        toolsRequired: 'เครื่องดูดฝุ่น, แปรง',
        isRequired: true,
        hasSignature: true,
        hasPhoto: true
      },
      {
        stepOrder: 4,
        checkItem: 'ตรวจสอบการทำงานของ Circuit Breaker',
        category: 'ทดสอบการทำงาน',
        standardValue: 'ทำงานปกติ สามารถเปิด-ปิดได้',
        method: 'ทดสอบ',
        toolsRequired: '-',
        isRequired: true,
        hasSignature: true,
        hasPhoto: false
      }
    ]
  },
  {
    name: 'PM มอเตอร์ตามมาตรฐาน ISO 14001',
    description: 'การตรวจสอบและบำรุงรักษามอเตอร์ตามมาตรฐานสิ่งแวดล้อม ISO 14001',
    machineType: 'Motor',
    frequencyType: 'monthly',
    frequencyValue: 2,
    durationMinutes: 90,
    standard: 'ISO 14001',
    items: [
      {
        stepOrder: 1,
        checkItem: 'วัดระดับการสั่นสะเทือน',
        category: 'วัดค่า',
        standardValue: 'ไม่เกิน 2.8 mm/s',
        unit: 'mm/s',
        method: 'เครื่องวัดการสั่นสะเทือน',
        toolsRequired: 'Vibration Meter',
        isRequired: true,
        hasSignature: true,
        hasPhoto: true
      },
      {
        stepOrder: 2,
        checkItem: 'วัดอุณหภูมิของมอเตอร์',
        category: 'วัดค่า',
        standardValue: 'ไม่เกิน 80°C',
        unit: '°C',
        method: 'เครื่องวัดอุณหภูมิ',
        toolsRequired: 'Infrared Thermometer',
        isRequired: true,
        hasSignature: true,
        hasPhoto: true
      },
      {
        stepOrder: 3,
        checkItem: 'ตรวจสอบเสียงผิดปกติ',
        category: 'ตรวจสอบด้วยการฟัง',
        standardValue: 'ไม่มีเสียงแปลก ๆ',
        method: 'ฟัง',
        toolsRequired: '-',
        isRequired: true,
        hasSignature: false,
        hasPhoto: false
      },
      {
        stepOrder: 4,
        checkItem: 'ทำความสะอาดพัดลมระบายความร้อน',
        category: 'บำรุงรักษา',
        standardValue: 'สะอาด ไม่มีฝุ่นสะสม',
        method: 'ทำความสะอาด',
        toolsRequired: 'แปรง, เครื่องเป่าลม',
        isRequired: true,
        hasSignature: true,
        hasPhoto: true
      },
      {
        stepOrder: 5,
        checkItem: 'ตรวจสอบน้ำมันจาระบี',
        category: 'บำรุงรักษา',
        standardValue: 'เพียงพอ ไม่แห้ง',
        method: 'สายตา',
        toolsRequired: 'จาระบี',
        isRequired: true,
        hasSignature: true,
        hasPhoto: false
      }
    ]
  }
];

async function seedPMTemplates() {
  try {
    console.log('🌱 Starting PM Template seeding...');

    // First, get the first user to assign as creator
    const firstUser = await prisma.user.findFirst();
    if (!firstUser) {
      console.log('❌ No users found. Please seed users first.');
      return;
    }

    // Clear existing PM templates
    await prisma.pMResult.deleteMany();
    await prisma.pMSchedule.deleteMany();
    await prisma.pMTemplateItem.deleteMany();
    await prisma.pMTemplate.deleteMany();

    console.log('🗑️  Cleared existing PM templates');

    // Create PM templates
    for (const templateData of pmTemplateData) {
      const { items, ...template } = templateData;
      
      await prisma.pMTemplate.create({
        data: {
          ...template,
          createdBy: firstUser.id,
          items: {
            create: items
          }
        }
      });
      
      console.log(`✅ Created PM template: ${template.name}`);
    }

    console.log('🎉 PM Template seeding completed successfully!');
    
    // Display summary
    const totalTemplates = await prisma.pMTemplate.count();
    const totalItems = await prisma.pMTemplateItem.count();
    
    console.log('\n📊 Summary:');
    console.log(`- Total PM Templates: ${totalTemplates}`);
    console.log(`- Total Template Items: ${totalItems}`);
    
  } catch (error) {
    console.error('❌ Error seeding PM templates:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run seeding if this file is executed directly
if (require.main === module) {
  seedPMTemplates()
    .then(() => {
      console.log('✨ PM Template seeding completed!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Failed to seed PM templates:', error);
      process.exit(1);
    });
}

module.exports = { seedPMTemplates };
