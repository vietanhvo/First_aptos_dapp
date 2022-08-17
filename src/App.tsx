import React, { createRef, useState, useEffect } from 'react';
import { Types, AptosClient, BCS, TxnBuilderTypes } from "aptos";
import './App.css';

const client = new AptosClient("http://127.0.0.1:8080");

function App() {
    const urlAddress = window.location.pathname.slice(1).toLowerCase();
    const isEditable = !urlAddress;

    const [address, setAddress] = useState<string | null>(null);
    const [_account, setAccount] = useState<Types.AccountData | null>(null);
    const [modules, setModules] = React.useState<Types.MoveModuleBytecode[]>([]);
    const [isSaving, setIsSaving] = useState(false);
    const [resources, setResources] = useState<Types.MoveResource[]>([]);

    const ref = createRef<HTMLTextAreaElement>();

    const handleSubmit = async (e: any) => {
        e.preventDefault();
        if (!ref.current) return;

        const message = ref.current.value;
        const transaction = new TxnBuilderTypes.TransactionPayloadScriptFunction(
            TxnBuilderTypes.ScriptFunction.natural(
                `${address}::message`,
                "set_message",
                [],
                [BCS.bcsSerializeStr(message)],
            )
        );

        try {
            setIsSaving(true);
            await window.aptos.signAndSubmitTransaction(transaction);
        } finally {
            setIsSaving(false);
        }
    };

    // Retrieve aptos account address on url (user's account if not )
    useEffect(() => {
        if (urlAddress) {
            setAddress(urlAddress);
        } else {
            window.aptos.account().then((data: { address: string }) => setAddress(data.address));
        }
    }, [urlAddress]);

    // Get account
    useEffect(() => {
        if (!address) return;
        client.getAccount(address).then(setAccount);
    }, [address])

    // Get all modules in this account
    useEffect(() => {
        if (!address) return;
        client.getAccountModules(address).then(setModules);
    }, [address]);

    // Get all resources in this account
    useEffect(() => {
        if (!address) return;
        client.getAccountResources(address).then(setResources);
    }, [address]);

    console.log(resources);
    const hasModule = modules.some((m) => m.abi?.name === "message");
    const publishInstructions = (
        <pre>
            Run this command to publish the module:
            <br />
            aptos move publish --package-dir /path/to/hello_blockchain/
            --named-addresses HelloBlockchain={address}
        </pre>
    );
    const resourceType = `${address}::message::MessageHolder`;
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
