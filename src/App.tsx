import React, { createRef, useState, useEffect } from 'react';
import { Types, AptosClient } from "aptos";
import './App.css';

const client = new AptosClient("https://fullnode.devnet.aptoslabs.com");

function App() {
    const urlAddress = window.location.pathname.slice(1);
    const isEditable = !urlAddress;

    const [address, setAddress] = useState<string | null>(null);
    const [account, setAccount] = useState<Types.AccountData | null>(null);
    const [modules, setModules] = React.useState<Types.MoveModuleBytecode[]>([]);
    const [isSaving, setIsSaving] = useState(false);
    const [resources, setResources] = useState<Types.MoveResource[]>([]);

    const ref = createRef<HTMLTextAreaElement>();

    function stringToHex(text: string) {
        const encoder = new TextEncoder();
        const encoded = encoder.encode(text);
        return Array.from(encoded, (i) => i.toString(16).padStart(2, "0")).join("");
    }

    const handleSubmit = async (e: any) => {
        e.preventDefault();
        if (!ref.current) return;

        const message = ref.current.value;
        const transaction = {
            type: "script_function_payload",
            function: `${address}::Message::set_message`,
            arguments: [stringToHex(message)],
            type_arguments: [],
        };

        try {
            setIsSaving(true);
            await window.aptos.signAndSubmitTransaction(transaction);
        } finally {
            setIsSaving(false);
        }
    };

    useEffect(() => {
        if (urlAddress) {
            setAddress(urlAddress);
        } else {
            window.aptos.account().then((data: { address: string }) => setAddress(data.address));
        }
    }, [urlAddress]);

    useEffect(() => {
        if (!address) return;
        client.getAccount(address).then(setAccount);
    }, [address])

    useEffect(() => {
        if (!address) return;
        client.getAccountModules(address).then(setModules);
    }, [address]);

    useEffect(() => {
        if (!address) return;
        client.getAccountResources(address).then(setResources);
    }, [address]);

    const hasModule = modules.some((m) => m.abi?.name === "message");
    const publishInstructions = (
        <pre>
            Run this command to publish the module:
            <br />
            aptos move publish --package-dir /path/to/hello_blockchain/
            --named-addresses HelloBlockchain={address}
        </pre>
    );
    const resourceType = {
        address: `${address}`,
        module: "Message",
        name: "MessageHolder",
        generic_type_params: [],
    };
    const resource = resources.find((r) => r.type == resourceType);
    const data = resource?.data as { message: string } | undefined;
    const message = data?.message;

    return (
        <div className="App">
            {hasModule ? (
                <form onSubmit={handleSubmit}>
                    <textarea ref={ref} defaultValue={message} readOnly={!isEditable} />
                    {isEditable && (<input disabled={isSaving} type="submit" />)}
                    {isEditable && (<a href={address!}>Get public URL</a>)}
                </form>
            ) : publishInstructions}
        </div>
    );
}

export default App;
