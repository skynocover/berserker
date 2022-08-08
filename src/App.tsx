import React from 'react';
import './App.css';

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

interface contractProfile {
  nftName: string;
  symbol: string;
  totalSupply: string;
  maxSupply: string;
  nftPrice: string;
  maxPerAddressMint: string;
}

function App() {
  const [spin, setSpin] = React.useState<boolean>(false);
  const [txError, setTxError] = React.useState<any>();
  const [errorMessage, setErrorMessage] = React.useState<string>('');
  const [provider, setProvider] = React.useState<ethers.providers.JsonRpcProvider>();
  const [address, setAddress] = React.useState<string>('');
  const [chainName, setChainName] = React.useState<string>('');
  const [contract, setContract] = React.useState<ethers.Contract>();
  const [profile, setProfile] = React.useState<contractProfile>();

  React.useEffect(() => {
    if (spin) {
      setErrorMessage('');
    }
  }, [spin]);

  React.useEffect(() => {
    if (txError) {
      const m = txError.message;
      const temp = m.match(/(?<=reason=)(.*?)(?=, method)/);
      if (temp && temp[0]) {
        setErrorMessage(temp[0]);
      } else {
        const temp = m.match(/(?<=errorArgs=)(.*?)(?=, errorName)/);
        if (temp && temp[0]) {
          setErrorMessage(temp[0]);
        }
      }
    }
  }, [txError]);

  const init = async () => {
    // @ts-ignore
    if (window.ethereum) {
      setSpin(true);
      // @ts-ignore
      const p = new ethers.providers.JsonRpcProvider('http://127.0.0.1:8545');
      // const p = new ethers.providers.Web3Provider(window.ethereum);
      // await p.send('eth_requestAccounts', []);
      setProvider(p);

      const { name } = await p.getNetwork();
      setChainName(name);

      const signer = p.getSigner();
      const address = await signer.getAddress();
      setAddress(address);

      const c = new ethers.Contract(
        import.meta.env.VITE_CONTRACT_ADDRESS,
        contractJson.abi,
        signer,
      );
      console.log(c);
      setContract(c);

      await getSetting(c);
      setSpin(false);
    }
  };

  const getSetting = async (contract: ethers.Contract) => {
    if (contract) {
      const nftName = await contract.name();
      const symbol = await contract.symbol();
      const maxSupply = (await contract.maxSupply()).toString();
      const totalSupply = (await contract.totalSupply()).toString();
      const nftPrice = ethers.utils.formatEther(await contract.nftPrice());
      const maxPerAddressMint = (await contract.maxPerAddressMint()).toString();

      setProfile({ nftName, symbol, totalSupply, maxSupply, nftPrice, maxPerAddressMint });
      setNewPrice(nftPrice);
      setNewMaxSupply(maxSupply);

      const baseURI = await contract.baseURI();
      setNewBaseURI(baseURI);

      const p = await contract.paused();
      setPause(p);

      const u = await contract.blindTokenURI();
      setNewBlindTokenURI(u);

      const a = await contract.maxPerAddressMint();
      setNewMaxMint(a.toString());
    }
  };

  React.useEffect(() => {
    init();
    // @ts-ignore
  }, [window.ethereum]);

  const renderProfile = () => {
    if (!profile) {
      return <></>;
    }
    return (
      <>
        <TableContainer>
          <Table variant="striped" colorScheme="teal" size="sm">
            <Thead>
              <Tr>
                <Th>Properties</Th>
                <Th>info</Th>
              </Tr>
            </Thead>
            <Tbody>
              <Tr>
                <Td>NFT name</Td>
                <Td> {profile.nftName}</Td>
              </Tr>
              <Tr>
                <Td>NFT symbol</Td>
                <Td> {profile.symbol}</Td>
              </Tr>
              <Tr>
                <Td>NFT per price (eth)</Td>
                <Td> {profile.nftPrice}</Td>
              </Tr>
              <Tr>
                <Td>Supply</Td>
                <Td> {`${profile.totalSupply}/${profile.maxSupply}`}</Td>
              </Tr>
              <Tr>
                <Td>NFT per address mint</Td>
                <Td> {profile.maxPerAddressMint}</Td>
              </Tr>
            </Tbody>
          </Table>
        </TableContainer>
      </>
    );
  };

  const [newPrice, setNewPrice] = React.useState<string>('');

  const setPrice = async () => {
    console.log(newPrice);
    const wai = ethers.utils.parseUnits(newPrice, 'ether');
    console.log(wai.toString());
    if (contract) {
      setSpin(true);
      const tx = await contract.setNftPrice(wai.toString());
      const res = await tx.wait();
      console.log(res);
      await getSetting(contract!);
      setSpin(false);
    }
  };

  const [newMaxSupply, setNewMaxSupply] = React.useState<string>('');
  const setMaxSupply = async () => {
    if (contract && profile) {
      if (newMaxSupply <= profile.maxSupply) {
        console.log('not allow');
        return;
      }
      setSpin(true);
      const tx = await contract.setMaxSupply(newMaxSupply);
      const res = await tx.wait();
      console.log(res);
      await getSetting(contract!);
      setSpin(false);
    }
  };

  const [newBaseURI, setNewBaseURI] = React.useState<string>('');
  const setBaseURI = async () => {
    if (contract) {
      setSpin(true);
      const tx = await contract!.setBaseURI(newBaseURI);
      const res = await tx.wait();
      console.log(res);
      await getSetting(contract!);
      setSpin(false);
    }
  };

  const [newMaxMint, setNewMaxMint] = React.useState<string>('');
  const setMaxMint = async () => {
    setSpin(true);
    if (contract) {
      const tx = await contract.setMaxPerAddressMint(newMaxMint);
      const res = await tx.wait();
      console.log(res);
      await getSetting(contract);
    }
    setSpin(false);
  };

  const [newBlindTokenURI, setNewBlindTokenURI] = React.useState<string>('');
  const setBlindTokenURI = async () => {
    console.log(newBlindTokenURI);
    setSpin(true);
    if (contract) {
      const tx = await contract.setBlindTokenURI(newBlindTokenURI);
      const res = await tx.wait();
      console.log(res);
      await getSetting(contract);
    }
    setSpin(false);
  };

  const setBlindBox = async (e: any) => {
    console.log(e.target.checked);
    if (contract) {
      setSpin(true);
      const tx = await contract.setBlindBoxOpened(e.target.checked);
      const res = await tx.wait();
      console.log(res);
      await getSetting(contract);
      setSpin(false);
    }
  };

  const [pause, setPause] = React.useState<boolean>(false);

  const pauseMint = async (e: any) => {
    if (contract) {
      setSpin(true);
      if (e.target.checked) {
        const tx = await contract.pause();
        const res = tx.wait();
        console.log(res);
      } else {
        const tx = await contract.unpause();
        const res = await tx.wait();
        console.log(res);
      }
      await getSetting(contract!);
      setSpin(false);
    }
  };
  interface whitelist {
    address: string;
    num: number;
  }
  const deleteList = (index: number) => {
    const temp = [...whiteList];
    console.log({ index });
    const temp2 = temp.filter((item, i) => i !== index);
    console.log(temp2);
    setWhiteList(temp2);
  };

  const [whiteList, setWhiteList] = React.useState<whitelist[]>([{ address: '', num: 0 }]);

  const confirmWhiteList = async () => {
    // seedAllowlist
    if (contract) {
      setSpin(true);
      let addrs: string[] = [];
      let nums: number[] = [];
      whiteList.map((item) => {
        addrs.push(item.address);
        nums.push(item.num);
      });
      const tx = await contract.seedAllowlist(addrs, nums);
      const res = await tx.wait;

      setSpin(false);
    }
  };

  const [balance, setBalance] = React.useState<string>();
  const getNewBalance = async () => {
    if (provider && contract) {
      setSpin(true);
      const balance = await provider.getBalance(contract.address);
      const temp = ethers.utils.formatEther(balance);
      setBalance(temp);
      setSpin(false);
    }
  };

  const withDraw = async () => {
    if (contract) {
      setSpin(true);
      const tx = await contract.withdraw();
      await tx.wait();
      setSpin(false);
    }
  };

  const renderSetting = () => (
    <div className="grid grid-cols-2 gap-2">
      <Text className="col-span-2"> Basic Setting</Text>

      <Input defaultValue={newPrice} onChange={(e) => setNewPrice(e.target.value)} />

      <Button colorScheme="blue" onClick={setPrice}>
        Set NFT price (ETH)
      </Button>

      <Input defaultValue={newMaxSupply} onChange={(e) => setNewMaxSupply(e.target.value)} />

      <Button colorScheme="blue" onClick={setMaxSupply}>
        Set maxSupply
      </Button>

      <Input defaultValue={newBaseURI} onChange={(e) => setNewBaseURI(e.target.value)}></Input>

      <Button colorScheme="blue" onClick={setBaseURI}>
        Set BaseURI
      </Button>

      <Input defaultValue={newMaxMint} onChange={(e) => setNewMaxMint(e.target.value)}></Input>

      <Button colorScheme="blue" onClick={setMaxMint}>
        Set Max PerAddress Mint
      </Button>

      {/** Operate */}
      <Text className="col-span-2">Operate</Text>

      <Text>Pause Mint</Text>
      <Switch isChecked={pause} onChange={pauseMint} />

      <Text>Balance: {balance}</Text>
      <Button colorScheme="blue" onClick={getNewBalance}>
        Get Balance
      </Button>
      <Button className="col-span-2" colorScheme="blue" onClick={withDraw}>
        Withdraw
      </Button>

      {/** Blind Box */}
      <Text className="col-span-2"> Blind Box</Text>

      <Input
        defaultValue={newBlindTokenURI}
        onChange={(e) => setNewBlindTokenURI(e.target.value)}
      ></Input>
      <Button colorScheme="blue" onClick={setBlindTokenURI}>
        Blind Token URI
      </Button>

      <Text>BlindBox Open</Text>
      <Switch onChange={setBlindBox} />

      {/** White List*/}
      <Text className="col-span-2">White List</Text>

      {whiteList.map((item, index) => (
        <div key={index} className="col-span-2 flex">
          <Input
            placeholder="address"
            value={whiteList[index].address}
            onChange={(e) => {
              const temp = [...whiteList];
              temp[index].address = e.target.value;
              setWhiteList(temp);
            }}
          ></Input>

          <Input
            placeholder="number"
            value={whiteList[index].num}
            onChange={(e) => {
              const temp = [...whiteList];
              temp[index].num = +e.target.value;
              setWhiteList(temp);
            }}
          ></Input>

          <Button colorScheme="blue" onClick={() => deleteList(index)}>
            Del
          </Button>
        </div>
      ))}

      <div />
      <Button
        colorScheme="blue"
        onClick={() => {
          setWhiteList([...whiteList, { address: '', num: 0 }]);
        }}
      >
        Add
      </Button>

      <div />
      <Button colorScheme="blue" onClick={confirmWhiteList}>
        Confirm white list
      </Button>
    </div>
  );

  const [mintNum, setMintNum] = React.useState<number>(0);
  const mint = async () => {
    try {
      if (contract) {
        setSpin(true);
        const tx = await contract.mint(mintNum, {
          value: ethers.utils
            .parseUnits(profile!.nftPrice, 'ether')
            .mul(ethers.BigNumber.from(mintNum)),
        });
        const res = await tx.wait();
        console.log(res);
      }
    } catch (error: any) {
      setTxError(error);
    }
    setSpin(false);
  };

  const allowMint = async () => {
    try {
      if (contract) {
        setSpin(true);
        const tx = await contract.allowlistMint({
          value: ethers.utils.parseUnits(profile!.nftPrice, 'ether'),
        });
        const res = await tx.wait();
        console.log(res);
      }
    } catch (error: any) {
      setTxError(error);
    }
    setSpin(false);
  };

  const renderMint = () => (
    <div className="grid grid-cols-3 gap-2">
      <NumberInput onChange={(v, n) => setMintNum(n)} min={0}>
        <NumberInputField />
        <NumberInputStepper>
          <NumberIncrementStepper />
          <NumberDecrementStepper />
        </NumberInputStepper>
      </NumberInput>

      <Button className="col-span-2" colorScheme="blue" onClick={mint}>
        Mint
      </Button>

      <Button className="col-span-3" colorScheme="blue" onClick={allowMint}>
        WhiteList Mint
      </Button>
    </div>
  );

  const [tokenId, setTokenId] = React.useState<number>(0);
  const [tokenURI, setTokenURI] = React.useState<string>('');
  const getTokenURI = async () => {
    try {
      setSpin(true);
      const res = await contract!.tokenURI(tokenId);
      console.log(res);
      setTokenURI(res);
    } catch (error) {
      setTxError(error);
      // console.log(error);
    }
    setSpin(false);
  };

  const [owner, setOwner] = React.useState<string>('');
  const getOwner = async () => {
    setSpin(true);
    const res = await contract!.ownerOf(tokenId);
    console.log(res);
    setOwner(res);
    setSpin(false);
  };

  const [getBalanceAddr, setGetBalanceAddr] = React.useState<string>('');
  const [nftBalance, setNftBalance] = React.useState<string>('');
  const getBalance = async () => {
    const res = await contract!.balanceOf(getBalanceAddr);
    setNftBalance(res.toString());
  };

  const [allow, setAllow] = React.useState<string>('');
  const getAllow = async () => {
    setSpin(true);
    const res = await contract!.allowlist(getBalanceAddr);
    console.log(res);
    setAllow(res.toString());
    setSpin(false);
  };

  const renderInfo = () => (
    <div className="grid grid-cols-2 gap-2">
      <Text>Token ID</Text>
      <NumberInput onChange={(v, n) => setTokenId(n)} min={0}>
        <NumberInputField />
        <NumberInputStepper>
          <NumberIncrementStepper />
          <NumberDecrementStepper />
        </NumberInputStepper>
      </NumberInput>

      <Button colorScheme="blue" onClick={getTokenURI}>
        Get Token URI
      </Button>
      <Text>{tokenURI}</Text>

      <Button colorScheme="blue" onClick={getOwner}>
        Get Owner
      </Button>
      <Text>{owner}</Text>

      <Text>Address</Text>
      <Input placeholder="Address" onChange={(e) => setGetBalanceAddr(e.target.value)}></Input>

      <Button colorScheme="blue" onClick={getBalance}>
        Get Balance
      </Button>
      <Text>{nftBalance}</Text>

      <Button colorScheme="blue" onClick={getAllow}>
        Get Allow Num
      </Button>
      <Text>{allow}</Text>
    </div>
  );

  return (
    <div className="App">
      <h1 className="text-3xl font-bold underline">Hello world!</h1>
      {spin && <Spinner />}
      {errorMessage && <Text color="red">{errorMessage}</Text>}
      <div className="card">
        <p>Chain: {chainName}</p>
        <p>
          {chainName !== import.meta.env.VITE_CHAINNAME && (
            <Text color="tomato">
              Please switch to{' '}
              <Link
                color="teal.500"
                target={'_blank'}
                href={`https://chainlist.org/chain/${import.meta.env.VITE_CHAINID}`}
              >
                {import.meta.env.VITE_CHAINNAME}
              </Link>
            </Text>
          )}
        </p>
      </div>
      <div>
        <p>{address}</p>
      </div>
      <Tabs>
        <TabList>
          <Tab>Contract Profile</Tab>
          <Tab>Contract Setting</Tab>
          <Tab>Mint</Tab>
          <Tab>Info</Tab>
        </TabList>

        <TabPanels>
          <TabPanel>{renderProfile()}</TabPanel>
          <TabPanel>{renderSetting()}</TabPanel>
          <TabPanel>{renderMint()}</TabPanel>
          <TabPanel>{renderInfo()}</TabPanel>
        </TabPanels>
      </Tabs>
    </div>
  );
}

export default App;
