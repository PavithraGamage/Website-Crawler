#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const readline = require('readline');

// Create interactive CLI
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Configuration object to be populated by user input
const userConfig = {
  startUrl: '',
  sitemapUrl: '',
  outputDir: './output',
  maxPages: 100,
  ignoreParams: true,
  useSitemap: false,
  skipImages: false,
  addSourceUrl: true,  // Add source URL to markdown
  cleanOutput: true,   // Clean up HTML comments and whitespace
  strictSitemapOnly: false // Only crawl URLs from sitemap
};

// Start the prompts
console.log('Website Crawler - Configuration Setup\n');

rl.question('Enter the website URL (e.g., https://example.com): ', (answer) => {
  userConfig.startUrl = answer.trim();
  
  rl.question('Do you want to use a sitemap? (y/n): ', (useSitemap) => {
    userConfig.useSitemap = useSitemap.toLowerCase() === 'y';
    
    if (userConfig.useSitemap) {
      rl.question('Enter the sitemap URL (e.g., https://example.com/sitemap.xml): ', (sitemapUrl) => {
        userConfig.sitemapUrl = sitemapUrl.trim();
        askRemainingQuestions();
      });
    } else {
      askRemainingQuestions();
    }
  });
});

function askRemainingQuestions() {
  rl.question(`Output directory (default: ${userConfig.outputDir}): `, (outputDir) => {
    if (outputDir.trim()) {
      userConfig.outputDir = outputDir.trim();
    }
    
    rl.question(`Maximum pages to crawl (default: ${userConfig.maxPages}): `, (maxPages) => {
      if (maxPages.trim() && !isNaN(parseInt(maxPages))) {
        userConfig.maxPages = parseInt(maxPages);
      }
      
      rl.question('Ignore URL parameters? (y/n, default: y): ', (ignoreParams) => {
        if (ignoreParams.trim().toLowerCase() === 'n') {
          userConfig.ignoreParams = false;
        }
        
        rl.question('Skip images when extracting content? (y/n, default: n): ', (skipImages) => {
          if (skipImages.trim().toLowerCase() === 'y') {
            userConfig.skipImages = true;
          }
          
          rl.question('Add source URL to markdown files? (y/n, default: y): ', (addSourceUrl) => {
            if (addSourceUrl.trim().toLowerCase() === 'n') {
              userConfig.addSourceUrl = false;
            }
            
            rl.question('Clean output (remove HTML comments, extra whitespace)? (y/n, default: y): ', (cleanOutput) => {
              if (cleanOutput.trim().toLowerCase() === 'n') {
                userConfig.cleanOutput = false;
              }
              
              if (userConfig.useSitemap) {
                rl.question('Only crawl URLs from sitemap (strict mode)? (y/n, default: n): ', (strictSitemapOnly) => {
                  if (strictSitemapOnly.trim().toLowerCase() === 'y') {
                    userConfig.strictSitemapOnly = true;
                  }
                  
                  // Save the configuration
                  saveConfig();
                });
              } else {
                // Save the configuration
                saveConfig();
              }
            });
          });
        });
      });
    });
  });
}

// Save configuration to a file
function saveConfig() {
  try {
    // Create config directory if it doesn't exist
    const configDir = path.join(__dirname, 'config');
    if (!fs.existsSync(configDir)) {
      fs.mkdirSync(configDir);
    }
    
    // Save configuration to a JSON file
    const configPath = path.join(configDir, 'crawler-config.json');
    fs.writeFileSync(configPath, JSON.stringify(userConfig, null, 2));
    
    console.log(`\nConfiguration saved to ${configPath}`);
    console.log('\nYou can now run the crawler using:');
    console.log('npm start');
    console.log('\nOr directly:');
    console.log('node website-crawler.js');
    
    rl.close();
  } catch (error) {
    console.error(`Error saving configuration: ${error.message}`);
    rl.close();
  }
}