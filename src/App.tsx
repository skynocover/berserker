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
  const [contractBalance, setContractBalance] = React.useState<string>();
  const [balance, setBalance] = React.useState<string>('');

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
    const ethereum = window.ethereum;
    if (ethereum && !provider) {
      setSpin(true);
      // @ts-ignore
      const p = new ethers.providers.Web3Provider(ethereum);
      // @ts-ignore
      await ethereum.enable();
      await p.send('eth_requestAccounts', []);
      setProvider(p);

      // @ts-ignore
      ethereum.on('accountsChanged', async (accounts: Array<string>) => {
        setAddress(accounts[0]);
        setBalance(ethers.utils.formatEther(await signer.getBalance()));
      });

      const { name } = await p.getNetwork();
      setChainName(name);

      const signer = p.getSigner();
      setAddress(await signer.getAddress());

      setBalance(ethers.utils.formatEther(await signer.getBalance()));

      const c = new ethers.Contract(
        import.meta.env.VITE_CONTRACT_ADDRESS,
        contractJson.abi,
        signer,
      );
      console.log(c);
      setContract(c);

      const balance = await p.getBalance(c.address);
      setContractBalance(ethers.utils.formatEther(balance));

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

      setNewBaseURI(await contract.baseURI());
      setPause(await contract.paused());
      setNewBlindTokenURI(await contract.blindTokenURI());
      setNewMaxMint((await contract.maxPerAddressMint()).toString());
      setWhitelistPause(await contract.allowlistPaused());
      setNewWhitelistPrice(ethers.utils.formatEther(await contract.allowlistNftPrice()));

      const DEFAULT_ADMIN_ROLE =
        '0x0000000000000000000000000000000000000000000000000000000000000000';
      const minterCount = (await contract.getRoleMemberCount(DEFAULT_ADMIN_ROLE)).toNumber();
      const members = [];
      for (let i = 0; i < minterCount; ++i) {
        members.push(await contract.getRoleMember(DEFAULT_ADMIN_ROLE, i));
      }
      setMembers([...members, '']);

      if (provider) {
        const balance = await provider.getBalance(contract.address);
        const temp = ethers.utils.formatEther(balance);
        setContractBalance(temp);
      }

      const sharingMember: sharingMember[] = [];
      const sharingCount = (await contract.getSharingMemberCount()).toNumber();
      for (let i = 0; i < sharingCount; i++) {
        const sharing = await contract.getSharingMember(i);
        sharingMember.push({
          address: sharing[0],
          share: sharing[1].toNumber(),
        });
      }
      setSharingMembers(sharingMember);
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
    const wai = ethers.utils.parseUnits(newPrice, 'ether');
    if (contract) {
      try {
        setSpin(true);
        const tx = await contract.setNftPrice(wai.toString());
        const res = await tx.wait();
        console.log(res);
        await getSetting(contract!);
      } catch (error) {
        setTxError(error);
      }
      setSpin(false);
    }
  };

  const [newWhitelistPrice, setNewWhitelistPrice] = React.useState<string>('');
  const setWhitelistPrice = async () => {
    const wai = ethers.utils.parseUnits(newWhitelistPrice, 'ether');
    if (contract) {
      try {
        setSpin(true);
        const tx = await contract.setAllowlistNftPrice(wai.toString());
        const res = await tx.wait();
        console.log(res);
        await getSetting(contract!);
      } catch (error) {
        setTxError(error);
      }
      setSpin(false);
    }
  };

  const [newBaseURI, setNewBaseURI] = React.useState<string>('');
  const setBaseURI = async () => {
    if (contract) {
      try {
        setSpin(true);
        const tx = await contract!.setBaseURI(newBaseURI);
        const res = await tx.wait();
        console.log(res);
        await getSetting(contract!);
      } catch (error) {
        setTxError(error);
      }
      setSpin(false);
    }
  };

  const [newMaxMint, setNewMaxMint] = React.useState<string>('');
  const setMaxMint = async () => {
    setSpin(true);
    if (contract) {
      try {
        const tx = await contract.setMaxPerAddressMint(newMaxMint);
        const res = await tx.wait();
        console.log(res);
        await getSetting(contract);
      } catch (error) {
        setTxError(error);
      }
    }
    setSpin(false);
  };

  const [newBlindTokenURI, setNewBlindTokenURI] = React.useState<string>('');
  const setBlindTokenURI = async () => {
    setSpin(true);
    if (contract) {
      try {
        const tx = await contract.setBlindTokenURI(newBlindTokenURI);
        const res = await tx.wait();
        console.log(res);
        await getSetting(contract);
      } catch (error) {
        setTxError(error);
      }
    }
    setSpin(false);
  };

  const setBlindBox = async (e: any) => {
    if (contract) {
      try {
        setSpin(true);
        const tx = await contract.setBlindBoxOpened(e.target.checked);
        const res = await tx.wait();
        console.log(res);
        await getSetting(contract);
      } catch (error) {
        setTxError(error);
      }
      setSpin(false);
    }
  };

  const [pause, setPause] = React.useState<boolean>(false);

  const pauseMint = async (e: any) => {
    if (contract) {
      try {
        setSpin(true);
        if (e.target.checked) {
          const tx = await contract.pause();
          const res = tx.wait();
        } else {
          const tx = await contract.unpause();
          const res = await tx.wait();
        }
        await getSetting(contract!);
      } catch (error) {
        setTxError(error);
      }
      setSpin(false);
    }
  };
  interface whitelist {
    address: string;
    num: number;
  }
  const deleteList = (index: number) => {
    const temp = [...whiteList];
    const temp2 = temp.filter((item, i) => i !== index);
    setWhiteList(temp2);
  };

  const [whiteList, setWhiteList] = React.useState<whitelist[]>([]);

  const confirmWhiteList = async () => {
    // seedAllowlist
    if (contract) {
      try {
        setSpin(true);
        let addrs: string[] = [];
        let nums: number[] = [];
        whiteList.map((item) => {
          addrs.push(item.address);
          nums.push(item.num);
        });
        const tx = await contract.seedAllowlist(addrs, nums);
        const res = await tx.wait;
        console.log(res);
        await getSetting(contract);
      } catch (error) {
        setTxError(error);
      }
      setSpin(false);
    }
  };

  const withDraw = async () => {
    if (contract) {
      try {
        setSpin(true);
        const tx = await contract.withdraw();
        await tx.wait();
        await getSetting(contract);
      } catch (error) {
        setTxError(error);
      }
      setSpin(false);
    }
  };

  const [whitelistPause, setWhitelistPause] = React.useState<boolean>(false);

  const pauseWhitelistMint = async (e: any) => {
    if (contract) {
      try {
        setSpin(true);
        if (e.target.checked) {
          const tx = await contract.allowlistPause();
          const res = tx.wait();
          console.log(res);
        } else {
          const tx = await contract.allowlistUnpause();
          const res = await tx.wait();
          console.log(res);
        }
        await getSetting(contract!);
      } catch (error) {
        setTxError(error);
      }
      setSpin(false);
    }
  };

  const [members, setMembers] = React.useState<string[]>([]);
  const addMember = async (address: string) => {
    if (contract) {
      try {
        setSpin(true);
        const tx = await contract.addMember(address);
        const res = tx.wait();
        await getSetting(contract!);
      } catch (error) {
        setTxError(error);
      }
      setSpin(false);
    }
  };

  const removeMember = async (address: string) => {
    if (!ethers.utils.isAddress(address)) {
      return;
    }
    if (contract) {
      try {
        setSpin(true);
        const tx = await contract.removeMember(address);
        const res = tx.wait();
        await getSetting(contract!);
      } catch (error) {
        setTxError(error);
      }
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

      <Input defaultValue={newBaseURI} onChange={(e) => setNewBaseURI(e.target.value)}></Input>

      <Button colorScheme="blue" onClick={setBaseURI}>
        Set BaseURI
      </Button>

      <Input defaultValue={newMaxMint} onChange={(e) => setNewMaxMint(e.target.value)}></Input>

      <Button colorScheme="blue" onClick={setMaxMint}>
        Set Max PerAddress Mint
      </Button>

      <Text>Pause Mint</Text>
      <Switch isChecked={pause} onChange={pauseMint} />

      {/** Blind Box*/}
      <Text className="col-span-2">Blind Box</Text>

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

      <Text>Pause Whitelist Mint</Text>
      <Switch isChecked={whitelistPause} onChange={pauseWhitelistMint} />

      <Input
        defaultValue={newWhitelistPrice}
        onChange={(e) => setNewWhitelistPrice(e.target.value)}
      />

      <Button colorScheme="blue" onClick={setWhitelistPrice}>
        Set Whitelist NFT price (ETH)
      </Button>

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

      <Button
        colorScheme="blue"
        onClick={() => {
          setWhiteList([...whiteList, { address: '', num: 0 }]);
        }}
        className="col-span-1"
      >
        Add
      </Button>
      <Button colorScheme="blue" onClick={confirmWhiteList}>
        Confirm white list
      </Button>

      {/** Operate */}
      <Text className="col-span-2">Operate</Text>

      <Button className="col-span-2" colorScheme="blue" onClick={withDraw}>
        Withdraw
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

  const [allowMintNum, setAllowMintNum] = React.useState<number>(0);
  const allowMint = async () => {
    try {
      if (contract) {
        setSpin(true);
        const price = ethers.utils.parseUnits(
          ethers.BigNumber.from(+newWhitelistPrice)
            .mul(allowMintNum)
            .toString(),
          'ether',
        );
        console.log({ price: price.toString() });
        const tx = await contract.allowlistMint(allowMintNum, { value: price });
        console.log('CCCC');
        const res = await tx.wait();
        console.log(res);
      }
    } catch (error: any) {
      setTxError(error);
    }
    setSpin(false);
  };

  interface sharingMember {
    address: string;
    share: number;
  }

  const [sharingMembers, setSharingMembers] = React.useState<sharingMember[]>([]);

  const deleteSharinList = (index: number) => {
    const temp = [...sharingMembers];
    const temp2 = temp.filter((item, i) => i !== index);
    setSharingMembers(temp2);
  };

  const confirmSharingList = async () => {
    if (contract) {
      try {
        setSpin(true);
        let addrs: string[] = [];
        let shares: number[] = [];
        sharingMembers.map((item) => {
          addrs.push(item.address);
          shares.push(item.share);
        });
        const tx = await contract.updateSharing(addrs, shares);
        const res = await tx.wait;
        console.log(res);
      } catch (error) {
        setTxError(error);
      }
      setSpin(false);
    }
  };

  const renderAdmin = () => (
    <div className="grid grid-cols-2 gap-2">
      {/** Members */}
      <Text className="col-span-2">Members</Text>

      {members.map((address, index) => (
        <div key={index} className="col-span-2 flex">
          <Input
            placeholder="address"
            value={address}
            onChange={(e) => {
              const temp = [...members];
              temp[index] = e.target.value;
              setMembers(temp);
            }}
          ></Input>

          {index === members.length - 1 ? (
            <Button
              colorScheme="blue"
              onClick={() => addMember(members[index])}
              className="col-span-1"
            >
              Add
            </Button>
          ) : (
            <Button colorScheme="blue" onClick={() => removeMember(members[index])}>
              Del
            </Button>
          )}
        </div>
      ))}

      {/** Sharing Member */}
      <Text className="col-span-2">Sharing Members</Text>

      {sharingMembers.map((member, index) => (
        <div className="col-span-2 flex">
          <Input
            placeholder="address"
            value={member.address}
            onChange={(e) => {
              const temp = [...sharingMembers];
              temp[index].address = e.target.value;
              setSharingMembers(temp);
            }}
          ></Input>

          <Input
            placeholder="number"
            value={member.share}
            onChange={(e) => {
              const temp = [...sharingMembers];
              temp[index].share = +e.target.value;
              setSharingMembers(temp);
            }}
          ></Input>

          <Button colorScheme="blue" onClick={() => deleteSharinList(index)}>
            Del
          </Button>
        </div>
      ))}

      <Button
        colorScheme="blue"
        onClick={() => {
          setSharingMembers([...sharingMembers, { address: '', share: 0 }]);
        }}
        className="col-span-1"
      >
        Add
      </Button>
      <Button colorScheme="blue" onClick={confirmSharingList}>
        Confirm sharing list
      </Button>
    </div>
  );

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

      <NumberInput onChange={(v, n) => setAllowMintNum(n)} min={0}>
        <NumberInputField />
        <NumberInputStepper>
          <NumberIncrementStepper />
          <NumberDecrementStepper />
        </NumberInputStepper>
      </NumberInput>

      <Button className="col-span-2" colorScheme="blue" onClick={allowMint}>
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
        <Text color="#ED64A6">Account Balance: {balance}</Text>
        <Text color="#ED64A6">Contract Balance: {contractBalance}</Text>
      </div>
      <Tabs>
        <TabList>
          <Tab>Contract Profile</Tab>
          <Tab>Contract Setting</Tab>
          <Tab>Contract Admin Setting</Tab>
          <Tab>Mint</Tab>
          <Tab>Info</Tab>
        </TabList>

        <TabPanels>
          <TabPanel>{renderProfile()}</TabPanel>
          <TabPanel>{renderSetting()}</TabPanel>
          <TabPanel>{renderAdmin()}</TabPanel>
          <TabPanel>{renderMint()}</TabPanel>
          <TabPanel>{renderInfo()}</TabPanel>
        </TabPanels>
      </Tabs>
    </div>
  );
}

export default App;
