document.addEventListener('DOMContentLoaded', function (event) {
  async function getproducts(event) {
  
    // define consts.
    const restapiserver = 'https://api.prime.coinbase.com';
    const websocketserver = 'wss:ws-feed.prime.coinbase.com';
    const websocketconnection = new WebSocket(websocketserver);
    const channels = ['ticker'];
    // defined key static (const) variables.

    function channelsubscription ( type, productid, channels ) { // create or discontinue subscription request...

      let subscriptionrequest = {
          'type': type,
          'product_ids': productid,
          'channels': channels
      }

      return subscriptionrequest;

    } // created or discontinued subscription request.

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
      let url = restapiserver + requestpath;
      let response = await fetch(url,requestoptions);
      let json = await response.json();
      // defined url and sent request.
    
      return json;
    
    } // made rest api request.
  
    // define variables.
    let currencypairvolumes = document.getElementById('currencypairvolumes');
    let productvolumestablebody = document.getElementById('productvolumestablebody');
    let currencypricestablebody = document.getElementById('currencypricestablebody');
    let products = await unsignedrestapirequest ( 'GET', '/products' );
    let productarray = new Array();
    let subscribed;
    // defined variables.

    currencypairvolumes.textContent += ' (' + products.length + ')'; /* add number of currency pairs to heading element */

    products.sort(function(a, b) { // sort products by quote currency.
      if (a.quote_currency.toUpperCase() < b.quote_currency.toUpperCase()) { return -1; }
      if (a.quote_currency.toUpperCase() > b.quote_currency.toUpperCase()) { return 1; }
      return 0; /* names must be equal */
    }); // sorted products by quote currency.

    for ( let i=0 ; i < products.length ; i++ ) { productarray[i] = products[i].id; } /* create product array */

    for ( let i=0 ; i < products.length ; i++ ) { // update the DOM.

      // define variables for new product volume row.
      let newvolumerow = productvolumestablebody.insertRow(-1);
      let newproductvolumeid = newvolumerow.insertCell(0);
      let newdailyvolume = newvolumerow.insertCell(1);
      let newaveragedailyvolume = newvolumerow.insertCell(2);
      // defined variables for product volume new row.

      // define variables for new product price row.
      let newpricerow = currencypricestablebody.insertRow(-1);
      let newprice = newpricerow.insertCell(0);
      let newproductpriceid = newpricerow.insertCell(1);
      let newrange = newpricerow.insertCell(2);
      let newspread = newpricerow.insertCell(3);
      // defined variables for new product price row.

      // define variables for data to be displayed in DOM.
      let price = 0;
      let productid = products[i].display_name;
      let range = 0;
      let spread = 0;
      let dailyvolume = 0;
      let averagedailyvolume = 0;
      // defined variables for data to be displayed in DOM.

      // insert data into DOM.
      newprice.appendChild(document.createTextNode(price));
      newproductvolumeid.appendChild(document.createTextNode(productid));
      newproductpriceid.appendChild(document.createTextNode(productid));
      newrange.appendChild(document.createTextNode(range));
      newspread.appendChild(document.createTextNode(spread));
      newdailyvolume.appendChild(document.createTextNode(dailyvolume));
      newaveragedailyvolume.appendChild(document.createTextNode(averagedailyvolume));
      // inserted data into DOM.

      // identify new elements.
      newprice.setAttribute("id", products[i].id + 'price');
      newproductvolumeid.setAttribute("id", products[i].id + 'volumeid');
      newproductpriceid.setAttribute("id", products[i].id + 'priceid');
      newrange.setAttribute("id", products[i].id + 'range');
      newspread.setAttribute("id", products[i].id + 'spread');
      newdailyvolume.setAttribute("id", products[i].id + 'dailyvolume');
      newaveragedailyvolume.setAttribute("id", products[i].id + 'averagedailyvolume');
      // identified new elements.

    } // updated the DOM.

    websocketconnection.onopen = () => { // on open connection and send subscribe request.
      console.log('connected');
      let subscriptionrequest = channelsubscription('subscribe', productarray, channels);
      try { websocketconnection.send(JSON.stringify(subscriptionrequest)); } catch (e) { console.error(e); }
    } // opened connection and sent subscribe request.
  
    websocketconnection.onerror = (error) => { // update console on connection error.
     console.log('WebSocket error: ${error}');
    } // updated console on connection error.
  
    websocketconnection.onmessage = (event) => { // start handling websocket messages.
      let jsondata = JSON.parse(event.data);
  
      function messagehandlerinfo(messagetype,infomessage,additionalinformation) {
        console.log(messagetype.padStart(8) + ' subscription message : ' + infomessage + ' [' + additionalinformation + ']');
      }
  
      async function messagehandlerexit(messagetype,exitmessage,additionalinformation) { // gracefully unsubscribe.
        console.log(messagetype.padStart(8) + ' message : ' + exitmessage + ' [' + additionalinformation + ']');
        let subscriptionrequest = channelsubscription('unsubscribe', productid, channels, signature, key, passphrase);
        try { websocketconnection.send(JSON.stringify(subscriptionrequest)); } catch (e) { console.error(e); } 
      }; // gracefully unsubscribe.
     
      if ( jsondata.type === 'error' ) { // report any errors sent by the websocket server...
        messagehandlerexit('error',jsondata.message,'error sent by the websocket server'); 
      } // reported errors.
  
      if ( jsondata.type === 'subscriptions' ) { // handle subscribe and unsubscribe messages. 
  
        if ( subscribed ) { // reported the confirmation of subscription messages and closed connection.
          console.log('both "subscribe" and "unsubscribe" messages received. closing connection...');
          try { websocketconnection.close(); } catch (e) { console.error(e); } // closed connection.
        } // reported the confirmation of subscription messages and closed connection.
        else { subscribed = true; } 
  
      } // handled subscribe and unsubscribe messages. 
  
      if ( jsondata.type === 'ticker' ) { // handle ticker message.
	     
	  // format data.
          let productid = jsondata.product_id; /* capture product id */
          let price = Number(jsondata.price).toFixed(2); /* capture price */
          let dailyvolume = Number(jsondata.volume_24h).toFixed(2); /* capture daily volume */
          let averagedailyvolume = Number(Number(jsondata.volume_30d)/30).toFixed(2); /* capture daily volume */
          let pricerange = Number(Number(jsondata.high_24h) - Number(jsondata.low_24h)).toFixed(2); /* capture trading price range */
          let percentpricerange = Number( 100 * (Number(jsondata.high_24h) - Number(jsondata.low_24h)) / Number(jsondata.price) ).toFixed(2); /* capture percentage trading range at present price */
          let pricespread = Number(Number(jsondata.best_ask) - Number(jsondata.best_bid)).toFixed(2); /* capture ask/bid price spread */
          let percentagepricespread = Number( 100 * ( Number(jsondata.best_ask) - Number(jsondata.best_bid) ) / Number(jsondata.best_ask) ).toFixed(2); /* capture ask/bid price spread */
	  // formatted data.

	  // populate DOM.
	  document.querySelector('#' + productid + 'price').textContent = price;
	  document.querySelector('#' + productid + 'range').textContent = percentpricerange + '%';
	  document.querySelector('#' + productid + 'spread').textContent = percentagepricespread + '%';
	  document.querySelector('#' + productid + 'dailyvolume').textContent = '$' + Number(dailyvolume).toLocaleString();
	  document.querySelector('#' + productid + 'averagedailyvolume').textContent = '$' + Number(averagedailyvolume).toLocaleString();
	  // populated DOM.
  
      } // handled ticker message.
  
    } // end handling websocket messages.

    websocketconnection.onclose = () => { // update console on close connection.
     console.log('disconnected');
    } // updated console on close connection.
  
  };
  
  getproducts(); /* run getproducts after the DOM loads */
});
