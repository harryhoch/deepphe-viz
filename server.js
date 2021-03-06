'use strict';

const Hapi = require('@hapi/hapi');
const HapiPino= require('hapi-pino')

const Inert = require('@hapi/inert');

const Vision = require('@hapi/vision');

const HapiSwagger = require('hapi-swagger');

const packageJson = require('./package.json');

// Routes definitions array, local module
const routes = require('./lib/routes.js');

// Load server configuration data
const serverConfig = require('./configs/server.json');

// Create a Hapi server instance
// If you plan to deploy your hapi application to a PaaS provider, 
// you must listen on host 0.0.0.0 rather than localhost or 127.0.0.1
const server = new Hapi.Server({
    host: serverConfig.host, 
    port: serverConfig.port,
    router: {
        isCaseSensitive: false,
        stripTrailingSlash: true // removes trailing slashes on incoming paths
    }
});

//Server Stop Event
server.events.on('stop', () => {

    console.log('Server stopped');
});
// Serve all routes defined in the routes array
// server.route() takes an array of route objects
server.route(routes);

// Register plugins and start the server
const init = async function() {
    // Register invert plugin to serve CSS and JS static files
    await server.register(Inert);

    // Register vision plugin to render view templates
    await server.register(Vision);

    // HapiSwagger settings for API documentation
    const swaggerOptions = {
        info: {
                title: 'DeepPhe-Viz API Documentation',
                version: packageJson.version, // Use Viz version as API version, can be different though
            },
        };

    // Register HapiSwagger
    await server.register(
        {
            plugin: HapiSwagger,
            options: swaggerOptions
        });

    // View templates rendering
    server.views({
        // Using handlebars as template engine responsible for
        // rendering templates with an extension of .html
        engines: {
            html: require('handlebars')
        },
        isCached: false, // Tell Hapi not to cache the view files, no need to restart app
        // Tell the server that our templates are located in the templates directory within the current path
        relativeTo: __dirname,
        path: './client/templates',
        layoutPath: './client/templates/layout',
        helpersPath: './client/templates/helpers'
    });
    function resSerializer(res) {
        return {
            body:res.raw.body
        };
      }

      await server.register({
        plugin: HapiPino,
        options:{
	    logRequestStart: false,
	    logRequestComplete: false,
            logPayload: true,
	    redact: ['req.headers'],
            serializers:{
            res: resSerializer
        },
        }
    })

    // Start the server
    await server.start();
    console.log(`DeepPhe-Viz HTTP Server is running at: ${server.info.uri}`);
    console.log('Server started successfully')
    
};

process.on('unhandledRejection', (err) => {
    console.loggr(err);
    process.exit(1);
});

init();
