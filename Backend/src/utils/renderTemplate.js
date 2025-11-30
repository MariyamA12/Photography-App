const fs = require('fs');
const path = require('path');
const Handlebars = require('handlebars');

module.exports = function renderTemplate(name, context) {
  const templatePath = path.join(__dirname, '..', 'emailTemplates', `${name}.hbs`);
  const source = fs.readFileSync(templatePath, 'utf8');
  const template = Handlebars.compile(source);
  return template(context);
};