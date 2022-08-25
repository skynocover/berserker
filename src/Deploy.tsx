import React from 'react';

import { ethers } from 'ethers';

import { Tabs, TabList, TabPanels, Tab, TabPanel, Link, Text, Input } from '@chakra-ui/react';
import { Button, ButtonGroup } from '@chakra-ui/react';
import contractJson from './contract.json';
import {
  Table,
  Thead,
  Tbody,
  Tfoot,
  Tr,
  Th,
  Td,
  TableCaption,
  TableContainer,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  NumberIncrementStepper,
  NumberDecrementStepper,
  Switch,
  Spinner,
} from '@chakra-ui/react';

function Deploy({
  provider,
  setContractAddress,
  signer,
}: {
  provider: ethers.providers.JsonRpcProvider | undefined;
  setContractAddress: React.Dispatch<React.SetStateAction<string>>;
  signer: ethers.providers.JsonRpcSigner | ethers.Wallet | undefined;
}) {
  const [name, setName] = React.useState<string>('Berserker');
  const [symbol, setSymbol] = React.useState<string>('BSK');
  const [baseURI, setBaseURI] = React.useState<string>('https://baseuri/');
  const [blindTokenURI, setBlindTokenURI] = React.useState<string>('https://berserker/blindToken');
  const [maxSupply, setMaxSupploy] = React.useState<number>(5000);
  const [nftPrice, setNftPrice] = React.useState<number>(1);
  const [maxPerAddressMint, setMaxPerAddressMint] = React.useState<number>(5);
  const [teamMint, setTeamMint] = React.useState<number>(0);

  const deploy = async () => {
    const nonce = await provider!.getTransactionCount(await signer!.getAddress());

    const factory = new ethers.ContractFactory(contractJson.abi, contractJson.bytecode).connect(
      signer!,
    );

    const contract = await factory.deploy(
      name,
      symbol,
      maxSupply,
      baseURI,
      ethers.utils.parseUnits(nftPrice.toString(), 'ether'),
      blindTokenURI,
      maxPerAddressMint,
      teamMint,
      { gasLimit: 30000000, nonce },
    );
    const tx = await contract.deployTransaction.wait();
    setContractAddress(contract.address);
  };
  return (
    <div className="grid grid-cols-2 gap-2">
      <Text className="col-span-2"> Basic Setting</Text>

      <Text>NFT Name</Text>
      <Input defaultValue={name} onChange={(e) => setName(e.target.value)} />

      <Text>NFT Symbol</Text>
      <Input defaultValue={symbol} onChange={(e) => setSymbol(e.target.value)} />

      <Text>BaseURI</Text>
      <Input defaultValue={baseURI} onChange={(e) => setBaseURI(e.target.value)} />

      <Text>BlindTokenURI</Text>
      <Input defaultValue={blindTokenURI} onChange={(e) => setBlindTokenURI(e.target.value)} />

      <Text>NFT Max Supply</Text>
      <NumberInput value={maxSupply} onChange={(v, n) => setMaxSupploy(n)} min={0}>
        <NumberInputField />
        <NumberInputStepper>
          <NumberIncrementStepper />
          <NumberDecrementStepper />
        </NumberInputStepper>
      </NumberInput>

      <Text>NFT NFT Price</Text>
      <NumberInput value={nftPrice} onChange={(v, n) => setNftPrice(n)} min={0}>
        <NumberInputField />
        <NumberInputStepper>
          <NumberIncrementStepper />
          <NumberDecrementStepper />
        </NumberInputStepper>
      </NumberInput>

      <Text>NFT Max Per Address Mint</Text>
      <NumberInput value={maxPerAddressMint} onChange={(v, n) => setMaxPerAddressMint(n)} min={0}>
        <NumberInputField />
        <NumberInputStepper>
          <NumberIncrementStepper />
          <NumberDecrementStepper />
        </NumberInputStepper>
      </NumberInput>

      <Text>NFT Init TeamMint</Text>
      <NumberInput value={teamMint} onChange={(v, n) => setTeamMint(n)} min={0}>
        <NumberInputField />
        <NumberInputStepper>
          <NumberIncrementStepper />
          <NumberDecrementStepper />
        </NumberInputStepper>
      </NumberInput>

      <Button className="col-span-2" colorScheme="blue" onClick={deploy}>
        Deploy
      </Button>
    </div>
  );
}

export { Deploy };
