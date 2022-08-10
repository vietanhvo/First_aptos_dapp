import React, { useState, useEffect } from 'react';
import { Types, AptosClient } from "aptos";
import './App.css';

const client = new AptosClient("https://fullnode.devnet.aptoslabs.com");

function App() {
    const [address, setAddress] = useState<string | null>(null);
    const [account, setAccount] = useState<Types.AccountData | null>(null);

    useEffect(() => {
        window.aptos.account().then((data: { address: string }) => setAddress(data.address));
    }, []);

    useEffect(() => {
        if (!address) return;
        client.getAccount(address).then(setAccount);
    }, [address])

    return (
        <div className="App">
            <p><code>{address}</code></p>
            <p>{account?.sequence_number}</p>
        </div>
    )
}

export default App;
