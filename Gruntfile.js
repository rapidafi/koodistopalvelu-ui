'use strict';

module.exports = function (grunt) {

  require('load-grunt-tasks')(grunt);
  require('time-grunt')(grunt);

  var distDir = 'dist';

  grunt.initConfig({
    clean: {
      files: distDir,
      options: {
        force: true
      }
    },
    useminPrepare: {
      html: [
        'src/index.html',
        'src/suomi.html',
        'src/opintopolku.html',
        'src/thl.html',
      ],
      options: {
        dest: distDir,
        flow: {
          steps: {
            'css': ['concat'],
            'js': ['concat']
          },
          post: {}
        }
      }
    },
    usemin: {
      html: [
        distDir+'/index.html',
        distDir+'/suomi.html',
        distDir+'/opintopolku.html',
        distDir+'/thl.html'
      ]
    },
    copy: {
      demo: {
        expand: true,
        cwd: 'src',
        src: [
          'demo/*'
        ],
        dest: distDir
      },
      html: {
        expand: true,
        cwd: 'src',
        src: [
          './*.html'
        ],
        dest: distDir,
        options : {
          noProcess: '**/*.{png,gif,jpg,ico,svg,eot,ttf,woff,woff2}',
          process: function (content) {
            return content.replace(/<!--dev-->.*<!--enddev-->/g, '')
              .replace(/<!-- mustache/g, '')
              .replace(/end mustache -->/g, '');
          }
        }
      },
      js: {
        expand: true,
        cwd: 'src',
        src: [
          'js/*'
        ],
        dest: distDir
      },
      css: {
        expand: true,
        cwd: 'src',
        src: [
          'css/*'
        ],
        dest: distDir
      },
      opensansfonts: {
        expand: true,
        cwd: 'node_modules/font-open-sans',
        src: [
          './fonts/**'
        ],
        dest: distDir+'/css'
      },
      bootstrapfonts: {
        expand: true,
        cwd: 'node_modules/bootstrap-css-only',
        src: [
          './fonts/**'
        ],
        dest: distDir+'/'
      },
      fontawesomefonts: {
        expand: true,
        cwd: 'node_modules/font-awesome',
        src: [
          './fonts/**'
        ],
        dest: distDir+'/'
      },
      favicon: {
        expand: true,
        cwd: 'src',
        src: [
          './*.png'
        ],
        dest: distDir
      }
    }
  });

  grunt.registerTask('default', [
    'build'
  ]);

  grunt.registerTask('build', [
    'clean',
    'useminPrepare',
    'concat',
    'copy',
    'usemin'
  ]);
};
