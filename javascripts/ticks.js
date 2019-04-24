document.addEventListener('DOMContentLoaded', function (event) {
  async function getticks(event) {
  
    // define consts.
    const selectedrestapiserver = document.getElementById('restapiserver').value;
    const selectedcurrency = document.getElementById('quotecurrency').value;
    const ascending = document.getElementById('orderlow').checked;
    const descending = document.getElementById('orderhigh').checked;
    // defined key static (const) variables.
  
    function filter (array, filters) { // filter an array of objects.
      let itemstoinclude = Object.keys(filters);
      return array.filter((item) => itemstoinclude.every((key) => (filters[key].indexOf(item[key]) !== -1)));
    } // filtered array.
  
    async function unsignedrestapirequest ( method, requestpath, body ) { // make rest api request.
     
      // define coinbase required headers.
      let headers = {
        'ACCEPT': 'application/json',
        'CONTENT-TYPE': 'application/json'
      };
      // defined coinbase required headers. yes... content-type is required.
      // see https://docs.prime.coinbase.com/#requests for more information.
    
      // define request options for http request.
      let requestoptions = { 'method': method, headers };
      if ( body !== undefined ) { requestoptions['body'] = body; }
      // defined request options for http request.
    
      // define url and send request.
      let url = selectedrestapiserver + requestpath;
      let response = await fetch(url,requestoptions);
      let json = await response.json();
      // defined url and sent request.
    
      return json;
    
    } // made rest api request.
  
    // define variables.
    let summarytablebody = document.getElementById('summarytablebody');
    let tablebodytotal = document.getElementById('totalvolume');
    let productlist = await unsignedrestapirequest ( 'GET', '/products' );
    let btcusdtick = await unsignedrestapirequest ( 'GET', '/products/BTC-USD/ticker' );
    let quotecurrencyfilter = { quote_currency: [selectedcurrency] }
    let selectedproducts = filter (productlist, quotecurrencyfilter);
    let totalvolume = 0; 
    let ticker = new Array(); 
    // defined variables.

    summarytablebody.innerHTML = ''; /* clear the table body to prepare it for new data */
    tablebodytotal.innerHTML = ''; /* clear the table body to prepare it for new data */

    for ( let i=0 ; i < selectedproducts.length ; i++ ) { // create ticker.

      // retrieve ticker information for selected quote currency.
      let lasttick = await unsignedrestapirequest ( 'GET', '/products/' + selectedproducts[i].id + '/ticker' ); 
      // retrieved ticker information for selected quote currency.

      ticker[i] = {  // create ticker object with all the information needed.
	"id": selectedproducts[i].id,
	"basecurrency": selectedproducts[i].base_currency,
	"quotecurrency": selectedproducts[i].quote_currency,
	"baseminimum": Number(selectedproducts[i].base_min_size),
	"basemaximum": Number(selectedproducts[i].base_max_size),
	"quoteincrement": Number(selectedproducts[i].quote_increment),
	"price": Number(lasttick.price),
	"quantity": Number(lasttick.size),
	"bid": Number(lasttick.bid),
	"ask": Number(lasttick.ask),
	"basevolume": Number(lasttick.volume),
      }  // created ticker object with all the information needed.

      if ( ticker[i].quotecurrency === 'BTC' ) { ticker[i].quotevolume = Number(lasttick.volume) * Number(lasttick.price) * Number(btcusdtick.price); } 
      else { ticker[i].quotevolume = Number(lasttick.volume) * Number(lasttick.price); }

      totalvolume += ticker[i].quotevolume; /* update total trading volume for the quote currency */

    } // created ticker.

    if ( ascending ) { ticker.sort((a, b) => a.quotevolume - b.quotevolume); } /* sort ticker array in ascending order */
    if ( descending ) { ticker.sort((a, b) => b.quotevolume - a.quotevolume); } /* sort ticker array in ascending order */

    for ( let i=0 ; i < selectedproducts.length ; i++ ) { // update DOM.

      // define variables for new row.
      let newrow = summarytablebody.insertRow(-1);
      let newproductid = newrow.insertCell(0);
      let newproductpercentvolume = newrow.insertCell(1);
      let newproductvolume = newrow.insertCell(2);
      // defined variables for new row.

      // define variables for data to be displayed in DOM.
      let selectedproductid = ticker[i].id;
      let selectedproductpercentvolume = 100 * ticker[i].quotevolume / totalvolume;
      let selectedproductvolume = Number(ticker[i].quotevolume.toFixed(2)).toLocaleString();
      // defined variables for data to be displayed in DOM.

      // insert data into DOM.
      newproductid.appendChild(document.createTextNode(selectedproductid));
      newproductpercentvolume.appendChild(document.createTextNode(selectedproductpercentvolume.toFixed(2) + '%'));
      newproductvolume.appendChild(document.createTextNode('$' + selectedproductvolume));
      document.getElementById('totalvolume').innerHTML = Number(totalvolume.toFixed(2)).toLocaleString() + ' USD';
      // inserted data into DOM.

    } // updated DOM.

    // update dropdown box options to include volume.
    document.getElementById('quotecurrency').options[document.getElementById('quotecurrency').selectedIndex].text = selectedcurrency + ' [' + Number(totalvolume.toFixed(2)).toLocaleString() + ' USD]';
    // updated dropdown box options to include volume.
	  
  };
  
  getticks(); /* run getticks after the DOM loads */
  document.querySelector('#restapiserver').addEventListener('change', getticks); /* run getticks again if user makes a request */
  document.querySelector('#quotecurrency').addEventListener('change', getticks); /* run getticks again if user makes a request */
  document.querySelector('#orderhigh').addEventListener('click', getticks); /* run getticks again if user makes a request */
  document.querySelector('#orderlow').addEventListener('click', getticks); /* run getticks again if user makes a request */
});
