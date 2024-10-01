const express = require("express");
const app = express();
const mongoose = require("mongoose");
const dateTime = require(__dirname + "/date.js");
const _ = require("lodash");

app.set('view engine', 'ejs');
mongoose.connect("mongodb://localhost:27017/todolistDB",  { useNewUrlParser: true,  useUnifiedTopology: true});

const bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));

const itemSchema = {
  name: String
};

const listSchema = {
  name: String,
  items: [itemSchema]
}

//Item collection and the schema to create collection
const Item = mongoose.model("Item", itemSchema);
const List = mongoose.model("List", listSchema);

const port = 3000;
const item1 = new Item({
  name: "apply"
});
const item2 = new Item({
  name: "study"
});
defaultItems = [item1, item2];

function addDefaultDb(){
  Item.insertMany(defaultItems, function(err){
    if(err){
      console.log(err);
    }
    else{
      console.log("Successfully add default items to database");
    }
  });
}

app.get('/', (req, res) => {

  Item.find({}, function(err, results){
    if(err){
      console.log(err);
    }
    else{
      if(results.length == 0){
        addDefaultDb();
        setTimeout(function(){
          res.redirect("/");
        }, 200);
        
      }
      else
        res.render("list", {day: dateTime, toDoList: results, listTitle: "default"});
    }
  });
  
  // res.sendFile("index.html");
});

app.get("/:customListName", (req, res) => {
  const customListName = _.capitalize(req.params.customListName);

  List.findOne({name: customListName}, function(err, result){
    if(err){
      console.log(err);
    }
    else{
      if(!result){
        const list = new List({
          name: customListName,
          item : defaultItems
        });
        list.save();
        result = list;
        // res.render("list", {day: dateTime + ". You are in the list: " + list.name, toDoList: list.items});
      }
      res.render("list", {day: dateTime + ". You are in the list: " + result.name, toDoList: result.items, listTitle: result.name});
    }
  });
});


app.post('/', (req, res) =>{
  // res.send('POST request to the homepage')
  const listTitle = req.body.list;

  const item = new Item({
    name: req.body.newItem
  });
  if(listTitle === "default"){
    item.save();
    res.redirect("/");
  }
  else{
    List.findOne({name: listTitle}, function(err, result){
      if(err){
        console.log(err);
      }
      else{
        // console.log(result);
        result.items.push(item);
        result.save();
        res.redirect("/" + listTitle);
      }
    });
  }
  
  // toDoList.push(req.body.newItem);
  // res.render("list", {day: dateTime, toDoList: toDoList});
});

app.post('/delete', (req, res) => {
  const checkedItemId = req.body.checkbox;
  const listName = req.body.listName;

  if(listName == "default"){
    Item.findByIdAndRemove(checkedItemId, function(err){
      if(err){
        console.log(err);
      }
      else{
        console.log("Successful remove item");
        res.redirect("/");
      }
    })
  }
  else{
    console.log(listName);
    List.findOneAndUpdate({name: listName}, {$pull: {items: {_id: checkedItemId}}}, function(err, results){
      //pull from items array the item with specific id
      if(!err){
        // results.save();
        // console.log(results);
        // console.log(checkedItemId);
        res.redirect("/" + listName);
      }
      else{
        console.log(err);
      }
    })
  }
  
});

app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`);
});
