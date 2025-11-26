const { PrismaClient } = require('@prisma/client');
const axios = require('axios');
const https = require('https');
const prisma = new PrismaClient();

class CompanyService {
  // Get all companies
  async getAllCompanies(filters = {}) {
    try {
      const { search, page = 1, limit = 10 } = filters;
      const skip = (page - 1) * limit;
      
      const where = search ? {
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { email: { contains: search, mode: 'insensitive' } },
          { detail: { contains: search, mode: 'insensitive' } }
        ]
      } : {};

      const [companies, total] = await Promise.all([
        prisma.company.findMany({
          where,
          include: {
            users: {
              select: {
                id: true,
                fullName: true,
                email: true,
                isActive: true,
                role: {
                  select: {
                    id: true,
                    name: true
                  }
                }
              }
            }
          },
          skip: parseInt(skip),
          take: parseInt(limit),
          orderBy: {
            createdAt: 'desc'
          }
        }),
        prisma.company.count({ where })
      ]);

      // Convert BigInt to string for JSON serialization
      const companiesWithStringCapital = companies.map(company => ({
        ...company,
        regisCapital: company.regisCapital ? company.regisCapital.toString() : null
      }));

      return {
        companies: companiesWithStringCapital,
        pagination: {
          total,
          page: parseInt(page),
          limit: parseInt(limit),
          totalPages: Math.ceil(total / limit)
        }
      };
    } catch (error) {
      throw new Error('Failed to fetch companies: ' + error.message);
    }
  }

  // Get company by ID
  async getCompanyById(id) {
    try {
      const company = await prisma.company.findUnique({
        where: { id: parseInt(id) },
        include: {
          users: {
            select: {
              id: true,
              fullName: true,
              email: true,
              phoneNumber: true,
              isActive: true,
              createdAt: true,
              role: {
                select: {
                  id: true,
                  name: true
                }
              }
            }
          }
        }
      });

      if (!company) {
        throw new Error('Company not found');
      }

      // Convert BigInt to string for JSON serialization
      if (company.regisCapital) {
        company.regisCapital = company.regisCapital.toString();
      }

      return company;
    } catch (error) {
      throw new Error('Failed to fetch company: ' + error.message);
    }
  }

  // Create new company
  async createCompany(data) {
    try {
      const company = await prisma.company.create({
        data: {
          name: data.name,
          tel: data.tel || null,
          email: data.email || null,
          detail: data.detail || null,
          regisNumber: data.regisNumber || null,
          regisDate: data.regisDate ? new Date(data.regisDate) : null,
          regisCapital: data.regisCapital ? BigInt(data.regisCapital) : null,
          address: data.address || null,
          addressId: data.addressId ? parseInt(data.addressId) : null,
          districtsId: data.districtsId || null,
          zipCode: data.zipCode ? parseInt(data.zipCode) : null,
          amphuresId: data.amphuresId ? parseInt(data.amphuresId) : null,
          provincesId: data.provincesId ? parseInt(data.provincesId) : null,
        },
        include: {
          users: {
            select: {
              id: true,
              fullName: true,
              email: true,
              role: {
                select: {
                  name: true
                }
              }
            }
          }
        }
      });

      // Convert BigInt to string for JSON serialization
      if (company.regisCapital) {
        company.regisCapital = company.regisCapital.toString();
      }

      return company;
    } catch (error) {
      if (error.code === 'P2002') {
        throw new Error('Company name already exists');
      }
      throw new Error('Failed to create company: ' + error.message);
    }
  }

  // Update company
  async updateCompany(id, data) {
    try {
      const company = await prisma.company.update({
        where: { id: parseInt(id) },
        data: {
          name: data.name,
          tel: data.tel || null,
          email: data.email || null,
          detail: data.detail || null,
          regisNumber: data.regisNumber || null,
          regisDate: data.regisDate ? new Date(data.regisDate) : null,
          regisCapital: data.regisCapital ? BigInt(data.regisCapital) : null,
          address: data.address || null,
          addressId: data.addressId ? parseInt(data.addressId) : null,
          districtsId: data.districtsId || null,
          zipCode: data.zipCode ? parseInt(data.zipCode) : null,
          amphuresId: data.amphuresId ? parseInt(data.amphuresId) : null,
          provincesId: data.provincesId ? parseInt(data.provincesId) : null,
        },
        include: {
          users: {
            select: {
              id: true,
              fullName: true,
              email: true,
              role: {
                select: {
                  name: true
                }
              }
            }
          }
        }
      });

      // Convert BigInt to string for JSON serialization
      if (company.regisCapital) {
        company.regisCapital = company.regisCapital.toString();
      }

      return company;
    } catch (error) {
      if (error.code === 'P2002') {
        throw new Error('Company name already exists');
      }
      if (error.code === 'P2025') {
        throw new Error('Company not found');
      }
      throw new Error('Failed to update company: ' + error.message);
    }
  }

  // Delete company
  async deleteCompany(id) {
    try {
      // Check if company has users
      const usersCount = await prisma.user.count({
        where: { companyId: parseInt(id) }
      });

      if (usersCount > 0) {
        throw new Error('Cannot delete company with active users');
      }

      await prisma.company.delete({
        where: { id: parseInt(id) }
      });

      return { message: 'Company deleted successfully' };
    } catch (error) {
      if (error.code === 'P2025') {
        throw new Error('Company not found');
      }
      throw new Error('Failed to delete company: ' + error.message);
    }
  }

  // Get company statistics
  async getCompanyStats() {
    try {
      const [totalCompanies, companiesWithUsers, recentCompanies] = await Promise.all([
        prisma.company.count(),
        prisma.company.count({
          where: {
            users: {
              some: {}
            }
          }
        }),
        prisma.company.count({
          where: {
            createdAt: {
              gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // Last 30 days
            }
          }
        })
      ]);

      return {
        totalCompanies,
        companiesWithUsers,
        companiesWithoutUsers: totalCompanies - companiesWithUsers,
        recentCompanies
      };
    } catch (error) {
      throw new Error('Failed to fetch company statistics: ' + error.message);
    }
  }

  // Sync companies from external API
  async syncCompaniesFromAPI() {
    try {
      const apiUrl = 'https://takeco.online:4004/api/v2/companyAll';
      const bearerToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjcxNDk0ZjIxLWYzNTUtNDRhNC05ZDFkLWZjOTk5NzU0MGI1NCIsIm5hbWUiOiJOYXR0YXBodW1pbiJ9.ww6EATAUM4b9U-JSkRan7_j5wrhiala46m2k4F8z0zs';

      console.log('Starting company sync from external API...');

      // Fetch companies from external API
      const response = await axios.get(apiUrl, {
        headers: {
          'Authorization': `Bearer ${bearerToken}`,
          'Content-Type': 'application/json'
        },
        httpsAgent: new https.Agent({
          rejectUnauthorized: false // Bypass SSL certificate verification
        }),
        timeout: 30000 // 30 second timeout
      });

      console.log('API Response status:', response.status);
      console.log('API Response data keys:', Object.keys(response.data));

      const apiData = response.data;
      
      // Extract companies array from API response - API returns data in 'result' field
      const companies = apiData.result || apiData.data || apiData.companies || apiData;
      
      if (!Array.isArray(companies)) {
        console.log('API response structure:', JSON.stringify(apiData, null, 2));
        throw new Error('Invalid API response format: expected array of companies');
      }

      console.log(`Found ${companies.length} companies in API response`);

      let syncStats = {
        total: companies.length,
        created: 0,
        updated: 0,
        skipped: 0,
        errors: []
      };

      // Process each company
      for (const apiCompany of companies) {
        try {
          // Map API fields to local database fields based on actual API response
          const companyData = {
            name: apiCompany.name,
            tel: apiCompany.tel,
            email: apiCompany.email,
            detail: apiCompany.detail,
            regisNumber: apiCompany.regis_number,
            regisDate: apiCompany.regis_date ? new Date(apiCompany.regis_date) : null,
            // Convert decimal to integer for BigInt (round down), handle null/undefined
            regisCapital: apiCompany.regis_capital ? 
              (isNaN(parseFloat(apiCompany.regis_capital)) ? null : BigInt(Math.floor(Math.abs(parseFloat(apiCompany.regis_capital))))) : 
              null,
            address: apiCompany.address,
            addressId: apiCompany.address_id ? parseInt(apiCompany.address_id) : null,
            districtsId: apiCompany.districts_id,
            zipCode: apiCompany.zip_code ? parseInt(apiCompany.zip_code) : null,
            amphuresId: apiCompany.amphures_id ? parseInt(apiCompany.amphures_id) : null,
            provincesId: apiCompany.provinces_id ? parseInt(apiCompany.provinces_id) : null,
          };

          // Validate required fields
          if (!companyData.name) {
            throw new Error('Company name is required');
          }

          // Check if company already exists (prioritize regis_number, then name)
          let existingCompany = null;
          
          // First try to find by registration number (most unique identifier)
          if (companyData.regisNumber) {
            existingCompany = await prisma.company.findFirst({
              where: { regisNumber: companyData.regisNumber }
            });
          }
          
          // If not found by regis number, try by exact name match
          if (!existingCompany && companyData.name) {
            existingCompany = await prisma.company.findFirst({
              where: { name: companyData.name }
            });
          }
          
          // If still not found, check for similar names (in case of slight variations)
          if (!existingCompany && companyData.name) {
            existingCompany = await prisma.company.findFirst({
              where: { 
                name: { 
                  contains: companyData.name.substring(0, 20), // Match first 20 chars
                  mode: 'insensitive' 
                } 
              }
            });
          }

          if (existingCompany) {
            // Update existing company
            try {
              await prisma.company.update({
                where: { id: existingCompany.id },
                data: companyData
              });
              syncStats.updated++;
            } catch (updateError) {
              // If update fails due to unique constraint, skip this company
              if (updateError.code === 'P2002') {
                console.log(`Skipped company due to constraint: ${companyData.name}`);
                syncStats.skipped++;
              } else {
                throw updateError;
              }
            }
          } else {
            // Create new company
            try {
              await prisma.company.create({
                data: companyData
              });
              syncStats.created++;
            } catch (createError) {
              // If create fails due to unique constraint, skip this company
              if (createError.code === 'P2002') {
                console.log(`Skipped company due to constraint: ${companyData.name}`);
                syncStats.skipped++;
              } else {
                throw createError;
              }
            }
          }
        } catch (error) {
          console.error(`Error processing company ${apiCompany.name || 'Unknown'}:`, error.message);
          syncStats.errors.push({
            company: apiCompany.name || 'Unknown',
            error: error.message
          });
        }
      }

      console.log('Sync completed:', syncStats);

      return {
        success: true,
        message: 'Company sync completed',
        stats: syncStats
      };
    } catch (error) {
      console.error('Sync error:', error);
      throw new Error('Failed to sync companies from API: ' + error.message);
    }
  }
}

module.exports = new CompanyService();