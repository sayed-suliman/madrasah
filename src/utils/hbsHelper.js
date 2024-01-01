const moment = require("moment");
const hbs = require("hbs");
const { grade } = require("../config/system");

hbs.registerHelper("ifEqual", function (arg1, arg2, options) {
  return arg1 == arg2 ? options.fn(this) : options.inverse(this);
});

hbs.registerHelper("ifCond", function (v1, operator, v2, options) {
  switch (operator) {
    case "==":
      return v1 == v2 ? options.fn(this) : options.inverse(this);
    case "===":
      return v1 === v2 ? options.fn(this) : options.inverse(this);
    case "!=":
      return v1 != v2 ? options.fn(this) : options.inverse(this);
    case "!==":
      return v1 !== v2 ? options.fn(this) : options.inverse(this);
    case "<":
      return v1 < v2 ? options.fn(this) : options.inverse(this);
    case "<=":
      return v1 <= v2 ? options.fn(this) : options.inverse(this);
    case ">":
      return v1 > v2 ? options.fn(this) : options.inverse(this);
    case ">=":
      return v1 >= v2 ? options.fn(this) : options.inverse(this);
    case "&&":
      return v1 && v2 ? options.fn(this) : options.inverse(this);
    case "||":
      return v1 || v2 ? options.fn(this) : options.inverse(this);
    default:
      return options.inverse(this);
  }
});

hbs.registerHelper("math", function (val1, operator, val2) {
  val1 = parseInt(val1);
  val2 = parseInt(val2);
  operator = operator?.replace(" ", "") || operator;
  switch (operator) {
    case "+":
      return val1 + val2;
    case "-":
      return val1 - val2;
    case "/":
      return val1 / val2;
    case "*":
      return val1 * val2;
    default:
      return val1 + val2;
  }
});

// get value of JSON from strings objects in exact object
hbs.registerHelper("toJSON", (data) => {
  return JSON.stringify(data);
});

// find length of an array
hbs.registerHelper("length", (array) => {
  return array.length;
});

// increment
hbs.registerHelper("increment", (value) => value + 1);

// format moment date
hbs.registerHelper("FormatDate", function (value) {
  let date = new Date(value);
  return moment(date).format("MM/DD/YYYY");
});
hbs.registerHelper("inputDate", function (value) {
  return moment(value).format("YYYY-MM-DD");
});

hbs.registerHelper("getMarkBySubject", function (subjectId, student) {
  const mark = student.marks.find(
    (mark) => mark.subject.toString() == subjectId
  );
  return mark?.marksObtained ?? 0;
});
hbs.registerHelper("totalObtainedMarks", function (student, classId) {
  return student.marks.reduce((total, mark) => {
    if (mark?.class?.toString() == classId) {
      return total + mark.marksObtained;
    }
    return total;
  }, 0);
});
hbs.registerHelper("totalMarks", function (classData) {
  return classData.subjects.reduce(
    (total, subject) => total + subject.totalMarks,
    0
  );
});
hbs.registerHelper(
  "percentageOfTotalMarks",
  function (obtainedMarks, totalMarks) {
    let percentage = (obtainedMarks / totalMarks) * 100;
    return isNaN(percentage) ? 0 : percentage.toFixed(2);
  }
);
hbs.registerHelper("studentRemarks", function (percentage) {
  for (const cutoff in grade) {
    if (parseFloat(percentage) >= parseFloat(cutoff)) {
      return grade[cutoff];
    }
  }
  return "Fail";
});
