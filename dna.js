// dna.js Template Cloner ~~ version 0.2 (beta)
// GPLv3/MIT ~~ dnajs.org/license.html
// Copyright (c) 2013 Center Key Software and other contributors

var dna = {};

dna.util = {
   defaults: function(options, defaults) {
      //Sets each missing field in options to its default value
      if (options)
         for (var field in defaults)
            if (defaults.hasOwnProperty(field))
               if (options[field] === undefined)
                  options[field] = defaults[field];
      return options || defaults;
      },
   value: function(data, fields) {  //example: { a: { b: 7 }}, 'a.b' --> 7
      if (typeof fields == 'string')
         fields = fields.split('.');
      return fields.length == 1 ? data[fields[0]] : this.value(data[fields[0]], fields.slice(1));
      },
   findAll: function(elem, selector) {
      return elem.find(selector).addBack(selector);
      },
   apply: function(elem, selector, func) {
      dna.util.findAll(elem, selector).each(func);
      },
   };

dna.compile = {
   regexDnaField: /^(~~|\{\{).*(~~|\}\})$/,  //example: ~~title~~
   regexDnaBasePairs: /~~|\{\{|\}\}/g,  //matches the two "~~" strings so they can be removed
   isDnaField: function() {
      var firstNode = $(this)[0].childNodes[0];
      return firstNode && firstNode.nodeValue &&
         firstNode.nodeValue.match(dna.compile.regexDnaField);
      },
   fieldElem: function() {
      //Example: "<p>~~age~~</p>" --> "<p class=dna-field data-field-age></p>"
      $(this).addClass('dna-field').data('dna-field',
         $(this).text().replace(dna.compile.regexDnaBasePairs, '')).empty();
      },
   attrElem: function() {
      //Example: "<p data-dna-attr=~~id:code~~></p>" --> "<p class=dna-attr data-dna-attr=['id','code']></p>"
      var list = $(this).data('dna-attr').replace(dna.compile.regexDnaBasePairs, '').split(/[,:]/);
      $(this).addClass('dna-attr').data('dna-attr', list);
      },
   classElem: function() {
      //Example: "<p data-dna-class=~~c1,c2~~></p>" --> "<p class=dna-class data-dna-class=['c1','c2']></p>"
      var list = $(this).data('dna-class').replace(dna.compile.regexDnaBasePairs, '').split(',');
      $(this).addClass('dna-class').data('dna-class', list);
      },
   template: function(template) {  //prepare template to be cloned
      var elems = template.elem.find('*').addBack();
      elems.filter(dna.compile.isDnaField).each(dna.compile.fieldElem);
      elems.filter('[data-dna-attr]').each(dna.compile.attrElem);
      elems.filter('[data-dna-class]').each(dna.compile.classElem);
      template.compiled = true;
      template.elem.removeClass('dna-template').addClass('dna-clone');
      }
   };

dna.store = {
   templates: null,
   stash: function() {
      var elem = $(this);
      if (!dna.store.templates)
         dna.store.templates = {};
      var name = elem.data('dna-name');
      dna.store.templates[name] = {
         name:      name,
         elem:      elem,
         container: elem.parent().addClass('dna-contains-' + name),
         compiled:  false,
         clones:    0
         };
      elem.detach();
      },
   getTemplate: function(name) {
      if (!dna.store.templates)
         $('.dna-template').each(dna.store.stash);
      var template = dna.store.templates[name];
      if (!template.compiled)
         dna.compile.template(template);
      return template;
      }
   };

dna.core = {
   inject: function(clone, data) {
      dna.util.apply(clone, '.dna-field', function() {
         $(this).html(dna.util.value(data, $(this).data('dna-field')));
         });
      var list, len, x;
      dna.util.apply(clone, '.dna-attr', function() {
         list = $(this).data('dna-attr');
         len = list.length / 2;
         for (x = 0; x < len; x = x + 2)
            $(this).attr(list[x], dna.util.value(data, list[x + 1]));
         });
      dna.util.apply(clone, '.dna-class', function() {
         list = $(this).data('dna-class');
         len = list.length;
         for (x = 0; x < len; x++)
            $(this).addClass(dna.util.value(data, list[x]));
         });
      },
   replicate: function(template, data, options) {
      var clone = template.elem.clone(true, true);
      template.clones++;
      dna.core.inject(clone, data);
      var container = options.holder ? dna.util.findAll(options.holder,
         '.dna-contains-' + template.name) : template.container;
      options.top ? container.prepend(clone) : container.append(clone);
      if (options.fade)
         clone.hide().fadeIn();
      return clone;
      },
   unload: function(name, data, options) {
      if (!data.error)
         dna.api.clone(name, data, options)
      }
   };

dna.api = {
   clone: function(name, data, options) {
      options = dna.util.defaults(options, { fade: false, top: false, holder: null });
      var template = dna.store.getTemplate(name);
      var list = data instanceof Array ? data : [data];
      var clones = $();
      for (var count = 0; count < list.length; count++)
         clones = clones.add(dna.core.replicate(template, list[count], options));
      return clones;
      },
   load: function(name, url, options) {
      $.getJSON(url, function(data) { dna.core.unload(name, data, options) });
      },
   empty: function(name, options) {
      options = dna.util.defaults(options, { fade: false });
      var duration = options.fade ? 'normal' : 0;
      var clones = dna.store.getTemplate(name).container.find('.dna-clone');
      return clones.fadeOut(duration, function() { $(this).remove(); });
      },
   mutate: function(clone, data) {
      dna.core.inject(clone, data);
      },
   debug: function() {
      console.log('~~ dns.js ~~');
      console.log('template count: ' + Object.keys(dna.store.templates).length);
      console.log('template names: ' + Object.keys(dna.store.templates));
      console.log(dna.store.templates);
      }
   };

dna.clone =  dna.api.clone;
dna.load =   dna.api.load;
dna.empty =  dna.api.empty;
dna.mutate = dna.api.mutate;
dna.debug =  dna.api.debug;



