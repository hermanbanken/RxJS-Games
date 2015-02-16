module.exports = function (grunt) {

    // Import dependencies
    grunt.loadNpmTasks('grunt-contrib-watch');
    grunt.loadNpmTasks('grunt-contrib-connect');
    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-open');
    grunt.loadNpmTasks('grunt-ts');

    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),
        connect: {
            server: {  // <--- Run a local server on :9999
                options: {
                    port: 9999,
                    base: './'
                }
            }
        },
        ts: {
            build: {
                src: ["src/*.ts"],
                out: "dest/build.js",
                options: {
                    target: "es5",
                    module: "commonjs",
                    sourceMaps: true,
                    declaration: false,
                    removeComments: true
                }
            },
            dist: {
                src: ["src/*.ts"],
                options: {
                    sourceMaps: false
                }
            }
        },
        uglify: {
            all: {
                files: {
                    'dest/build.min.js': ['dest/build.js']
                }
            }
        },
        watch: {
            all: { // <--- Watch for changes and rebuild
                files: ['src/*.ts', 'src/!*.d.ts', 'tests/*.ts', '!tests/*.d.ts'],
                tasks: ['ts:build', 'uglify:all']
            }
        },
        open: { // <--- Launch index.html in browser when you run grunt
            dev: {
                path: 'http://localhost:9999/index.html'
            }
        }
    });

    //
    //grunt.initConfig({
    //  ts: {
    //    all: { // <-- compile all the files in / to build.js
    //      src: ['*.ts', '!*.d.ts'],
    //      out: 'build.js',
    //      options: {
    //        target: 'es5',
    //        sourceMaps: true,
    //        declaration: true,
    //        removeComments: true
    //      }
    //    },
    //    test: { // <-- compile all the files in / to build.js
    //      src: ['tests/*.ts', '!tests/*.d.ts'],
    //      out: 'tests/test.js',
    //      options: {
    //        target: 'es5',
    //        sourceMaps: true,
    //        declaration: true,
    //        removeComments: true
    //      }
    //    },
    //  },
    //});

    // Register the default tasks to run when you run grunt
    grunt.registerTask('default', ['ts', 'uglify', 'connect', 'open', 'watch']);
}