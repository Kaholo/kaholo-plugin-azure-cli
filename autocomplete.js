async function listScope(query) {
    let options = [
      {
        "id":"project",
        "value":"Project"
      },
      {
        "id":"organization",
        "value":"Organization"
      }
    ]
    //let options = response.items.map((item) => ({ id: item.id, value: item.name}));
    if (!query) {
        return options;
    }
    const filteredList = options.filter(val => val.value.includes(query))
    return filteredList;
}


module.exports = {
  listScope
}